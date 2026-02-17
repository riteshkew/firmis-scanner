import { createClient } from '@supabase/supabase-js'

// ISSUE: Service role key exposed in client code! (supa-key-001)
// This is CRITICAL - service_role bypasses all RLS
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjIwMDAwMDAwLCJleHAiOjE5MzUwMDAwMDB9.service_role_secret_key_here'

// ISSUE: Using service_role in client bundle
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY
)

// Another pattern - service role key reference
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// This pattern is also dangerous
async function deleteAllUsers() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  return { data, error }
}
