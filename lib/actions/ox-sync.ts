"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/actions/auth-helpers";
import { updatePackageStatus } from "@/lib/actions/packages";
import { getAllOxPackages, mapOxStatusToDeltraStatus, upsertOxCustomer, OxApiError } from "@/lib/ox-api";
import type { TablesInsert } from "@/lib/database.types";

type ActionResult = { success: true } | { success: false; error: string };

const setMailboxSchema = z.object({
  customerId: z.string().uuid(),
  mailboxNumber: z.number().int().positive().nullable(),
});

export async function setCustomerMailboxNumber(input: z.infer<typeof setMailboxSchema>): Promise<ActionResult> {
  const parsed = setMailboxSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid mailbox number." };

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: "Admin access required." };

  const { error } = await supabase.rpc("admin_set_mailbox_number", {
    target_id: parsed.data.customerId,
    // The generated RPC arg type is non-null (Postgres param nullability
    // isn't reflected in supabase-js typegen) — the column itself has no
    // NOT NULL constraint, so passing null here is a valid, intentional
    // "clear this customer's mailbox number" call.
    new_mailbox_number: parsed.data.mailboxNumber as number,
  });
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That mailbox number is already assigned to another customer." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/warehouse");
  return { success: true };
}

type ImportSummary =
  | {
      success: true;
      totalFetched: number;
      created: number;
      statusUpdated: number;
      unmatchedMailbox: number;
      invalidWeight: number;
      conflicts: number;
    }
  | { success: false; error: string };

function toDateOnly(isoDate: string): string {
  return isoDate.slice(0, 10);
}

/** Pulls every package from OX, matches recipient.mailboxNumber against
 *  profiles.mailbox_number, and upserts into Deltra's own packages table
 *  keyed by tracking_number. A tracking number that already belongs to a
 *  different customer is left untouched and reported as a conflict rather
 *  than silently reassigned. */
export async function importPackagesFromOx(): Promise<ImportSummary> {
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!isAdmin || !user) return { success: false, error: "Admin access required." };

  let oxPackages;
  try {
    oxPackages = await getAllOxPackages();
  } catch (err) {
    return { success: false, error: err instanceof OxApiError ? err.message : "Failed to reach the OX API." };
  }

  const { data: linkedProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, mailbox_number")
    .not("mailbox_number", "is", null);
  if (profilesError) return { success: false, error: profilesError.message };

  const profileByMailbox = new Map<number, string>();
  for (const row of linkedProfiles ?? []) {
    if (row.mailbox_number !== null) profileByMailbox.set(row.mailbox_number, row.id);
  }

  let created = 0;
  let statusUpdated = 0;
  let unmatchedMailbox = 0;
  let invalidWeight = 0;
  let conflicts = 0;

  for (const pkg of oxPackages) {
    const customerId = profileByMailbox.get(pkg.recipient.mailboxNumber);
    if (!customerId) {
      unmatchedMailbox++;
      continue;
    }

    const { data: existing } = await supabase
      .from("packages")
      .select("id, customer_id, status")
      .eq("tracking_number", pkg.trackingNo)
      .maybeSingle();

    const resolvedStatus = mapOxStatusToDeltraStatus(pkg.status);

    if (existing) {
      if (existing.customer_id !== customerId) {
        conflicts++;
        continue;
      }
      if (resolvedStatus && resolvedStatus !== existing.status) {
        const result = await updatePackageStatus({ packageId: existing.id, status: resolvedStatus });
        if (result.success) statusUpdated++;
      }
      continue;
    }

    if (!(pkg.weight > 0)) {
      invalidWeight++;
      continue;
    }

    const insertPayload: TablesInsert<"packages"> = {
      customer_id: customerId,
      tracking_number: pkg.trackingNo,
      merchant: "Received via Kajay Warehousing",
      description: pkg.description,
      weight_lb: pkg.weight,
      date_received: toDateOnly(pkg.createdOn),
      created_by: user.id,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("packages")
      .insert(insertPayload)
      .select("id, status")
      .single();
    if (insertError || !inserted) continue;
    created++;

    if (resolvedStatus && resolvedStatus !== inserted.status) {
      const result = await updatePackageStatus({ packageId: inserted.id, status: resolvedStatus });
      if (result.success) statusUpdated++;
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/warehouse");
  revalidatePath("/dashboard");

  return {
    success: true,
    totalFetched: oxPackages.length,
    created,
    statusUpdated,
    unmatchedMailbox,
    invalidWeight,
    conflicts,
  };
}

type CustomerSyncSummary =
  | {
      success: true;
      attempted: number;
      synced: number;
      failed: Array<{ name: string; mailboxNumber: number; error: string }>;
    }
  | { success: false; error: string };

/** Pushes every Deltra customer that already has a mailbox_number assigned
 *  up to OX (create-or-update, matched by that number). Customers without
 *  one yet are skipped — Deltra doesn't own OX's mailbox numbering, so it
 *  never invents one. */
export async function syncCustomersToOx(): Promise<CustomerSyncSummary> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: "Admin access required." };

  const { data: customers, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, mailbox_number")
    .eq("role", "customer")
    .not("mailbox_number", "is", null);
  if (error) return { success: false, error: error.message };

  const failed: Array<{ name: string; mailboxNumber: number; error: string }> = [];
  let synced = 0;

  for (const customer of customers ?? []) {
    if (customer.mailbox_number === null) continue;
    const name = `${customer.first_name} ${customer.last_name}`.trim();
    try {
      await upsertOxCustomer({
        firstName: customer.first_name,
        lastName: customer.last_name,
        mailboxNumber: customer.mailbox_number,
      });
      synced++;
    } catch (err) {
      failed.push({
        name,
        mailboxNumber: customer.mailbox_number,
        error: err instanceof OxApiError ? err.message : "Sync failed.",
      });
    }
  }

  return { success: true, attempted: (customers ?? []).length, synced, failed };
}
