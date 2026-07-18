import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendEmail } from "@/lib/notifications/email";
import { sendSms } from "@/lib/notifications/sms";

/**
 * Records an in-app message (existing behavior) and, best-effort, also sends
 * a real email/SMS when Resend/Twilio are configured — both notification
 * helpers no-op cleanly when their env vars aren't set, so this is always
 * safe to call. A notification failure never fails the caller's main action;
 * the in-app message is the source of truth either way.
 */
export async function notifyCustomer(
  supabase: SupabaseClient<Database>,
  input: { customerId: string; title: string; body: string }
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    customer_id: input.customerId,
    title: input.title,
    body: input.body,
  });
  if (error) return;

  const { data: profile } = await supabase.from("profiles").select("email, phone").eq("id", input.customerId).single();
  if (!profile) return;

  await Promise.all([
    sendEmail({ to: profile.email, subject: input.title, text: input.body }),
    profile.phone ? sendSms({ to: profile.phone, body: `${input.title}: ${input.body}` }) : Promise.resolve(),
  ]);
}
