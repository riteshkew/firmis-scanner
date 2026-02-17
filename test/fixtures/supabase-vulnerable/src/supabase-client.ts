import { createClient } from '@supabase/supabase-js'

// ISSUE: Hardcoded Supabase URL (supa-key-003)
const supabaseUrl = 'https://abcdefghij.supabase.co'

// ISSUE: Hardcoded anon key (supa-key-003)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMDAwMDAwMCwiZXhwIjoxOTM1MDAwMDAwfQ.abcdefghijklmnopqrstuvwxyz1234567890ABCDEF'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// This is fine - uses env vars
export const supabaseFromEnv = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
