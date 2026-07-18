"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

export async function markMessagesRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const { error } = await supabase.from("messages").update({ read: true }).eq("customer_id", user.id).eq("read", false);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
