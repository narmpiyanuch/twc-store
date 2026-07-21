import { createClient } from "@supabase/supabase-js";

// Publishable values are safe in browser code; Vercel env vars can override them.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pspxqqptqdbkionxjdpz.supabase.co";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_eHuNlIipQRhWCgsrlQXZEA_u74VZDfa";

export const supabase = createClient(url, publishableKey);
