/**
 * supabase-admin.ts — SERVER ONLY
 *
 * Supabase admin client using the service_role key.
 * The `import "server-only"` guard ensures Next.js throws a build error if this
 * module is accidentally imported in a Client Component, preventing the
 * service_role key from being bundled into the browser.
 *
 * Use this client ONLY in:
 *  - Server Actions (`"use server"`)
 *  - Server-side utilities (e.g. app/_lib/kds-broadcast.ts)
 *  - API Route Handlers (route.ts)
 *
 * Never import this in Client Components or files imported by them.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
