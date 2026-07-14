import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Client-side Supabase client (anon role). Safe to use in Client Components and Server Components. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
