import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase env belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Salin .env.example menjadi .env.local lalu isi nilainya.",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

let sharedClient: SupabaseClient | null = null;

// Lazy singleton: tidak dibuat saat modul di-import agar halaman publik
// tidak crash sebelum env sempat diperiksa di dalam handler.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!sharedClient) sharedClient = createClient() as unknown as SupabaseClient;
    const value = (sharedClient as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(sharedClient)
      : value;
  },
});
