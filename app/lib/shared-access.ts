import { supabase } from "./supabase";

// Verify password using server-side verifier function `verify_shared_password`.
// This avoids exposing the stored hash to anonymous clients.
export async function verifySharedPassword(input: string): Promise<boolean> {
  if (!input || !input.trim()) return false;
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("verify_shared_password", {
      pwd: input,
    });

    if (error) {
      console.error("verify_shared_password RPC error", error);
      return false;
    }

    // RPC returns boolean or { verify_shared_password: boolean } depending on client lib
    if (typeof data === "boolean") return data;
    if (data && typeof (data as any).verify_shared_password === "boolean")
      return (data as any).verify_shared_password;

    // Fallback: check first element
    if (Array.isArray(data) && data.length > 0) return Boolean(data[0]);
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}
