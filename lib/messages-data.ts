import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/messages";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** RLS scopes this to the caller's own messages — no explicit filter needed. */
export async function getMessagesForCurrentUser(): Promise<Message[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase.from("profiles").select("account_code").eq("id", user.id).single();
  const accountCode = profile?.account_code ?? "";

  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    accountCode,
    title: row.title,
    body: row.body,
    timestamp: formatTimestamp(row.created_at),
    read: row.read,
  }));
}
