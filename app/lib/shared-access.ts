import { supabase } from "./supabase";

export async function getSharedPassword(): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "shared_password")
    .maybeSingle();

  if (error) {
    console.error("Shared password lookup failed", error);
    return null;
  }

  const value = typeof data?.value === "string" ? data.value.trim() : "";
  return value ? value : null;
}

export async function verifySharedPassword(input: string): Promise<boolean> {
  if (!input.trim()) return false;
  const sharedPassword = await getSharedPassword();
  return Boolean(sharedPassword && input === sharedPassword);
}
