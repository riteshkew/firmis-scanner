/**
 * VIBE CODER: Common client-side mistakes from AI-assisted development
 * "Claude told me to do this" / "It works in development"
 */

import { createClient } from '@supabase/supabase-js'

// MISTAKE #1: Hardcoded credentials (copied from Supabase dashboard)
const supabase = createClient(
  'https://xyzcompany.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4MDIyNDAwMCwiZXhwIjoxOTk1ODAwMDAwfQ.anon-key-here'
)

// MISTAKE #2: Service role key in client code
// "I couldn't figure out why RLS was blocking me so I used the service key"
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2ODAyMjQwMDAsImV4cCI6MTk5NTgwMDAwMH0.service-role-key'
)

// MISTAKE #3: Logging sensitive data
async function debugLogin(email: string, password: string) {
  console.log('Attempting login with:', { email, password }) // OOPS
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  console.log('Auth response:', JSON.stringify(data)) // Logs tokens!
  return data
}

// MISTAKE #4: No error handling on auth
async function unsafeSignUp(email: string, password: string) {
  const { data } = await supabase.auth.signUp({ email, password })
  // No error handling - if this fails, app breaks silently
  return data.user!.id // Will throw if signup failed
}

// MISTAKE #5: Exposing all data without pagination
async function getAllProducts() {
  // "It was slow so I removed the limit"
  const { data } = await supabase
    .from('products')
    .select('*')
  // No .limit() - returns ALL products, could be millions
  return data
}

// MISTAKE #6: User input directly in query
async function searchUsers(searchTerm: string) {
  // Direct string interpolation - potential for abuse
  const { data } = await supabase
    .from('users')
    .select('*')
    .ilike('email', `%${searchTerm}%`) // User controls the pattern
  return data
}

// MISTAKE #7: Trusting client-side user data
async function updateProfile(userId: string, updates: any) {
  // userId comes from client - user could update any profile!
  const { data } = await supabase
    .from('profiles')
    .update(updates) // `updates` is unsanitized
    .eq('id', userId)
  return data
}

// MISTAKE #8: Storing sensitive data in localStorage
function cacheUserData(user: any) {
  // Tokens and PII in localStorage - vulnerable to XSS
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('access_token', user.access_token)
  localStorage.setItem('refresh_token', user.refresh_token)
}

// MISTAKE #9: No CSRF protection on sensitive action
async function deleteAccount(userId: string) {
  // No confirmation, no CSRF token
  await supabase.from('users').delete().eq('id', userId)
  await supabase.auth.signOut()
}

// MISTAKE #10: Exposing admin functionality to all users
async function adminGetAllUsers() {
  // This should check if user is admin first!
  const { data } = await adminClient
    .from('users')
    .select('id, email, created_at, last_sign_in')
  return data
}

// MISTAKE #11: Race condition in balance update
async function transferMoney(fromId: string, toId: string, amount: number) {
  // Read-modify-write without transaction
  const { data: fromUser } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', fromId)
    .single()

  // Race condition window here!

  await supabase.from('wallets').update({
    balance: fromUser!.balance - amount
  }).eq('id', fromId)

  await supabase.from('wallets').update({
    balance: supabase.rpc('increment_balance', { amount })
  }).eq('id', toId)
}

// MISTAKE #12: Infinite recursion in realtime subscription
function setupRealtimeSync() {
  supabase
    .channel('public:messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' },
      async (payload) => {
        // This triggers another change, causing infinite loop!
        await supabase.from('messages').update({
          synced_at: new Date()
        }).eq('id', payload.new.id)
      }
    )
    .subscribe()
}

// MISTAKE #13: Uploading without validation
async function uploadFile(file: File) {
  // No file type validation, no size limit
  const { data } = await supabase.storage
    .from('uploads')
    .upload(`files/${file.name}`, file)
  // Could upload .exe, .php, anything!
  return data
}

// MISTAKE #14: Exposing internal IDs in URLs
function getProductUrl(product: any) {
  // Sequential IDs allow enumeration
  return `/products/${product.id}` // id is auto-increment integer
}

// MISTAKE #15: Session stored in URL (for "easy sharing")
function createShareableLink(sessionToken: string) {
  // Session token in URL - will be logged, cached, shared
  return `https://myapp.com/dashboard?token=${sessionToken}`
}

export {
  supabase, adminClient,
  debugLogin, unsafeSignUp, getAllProducts, searchUsers,
  updateProfile, cacheUserData, deleteAccount, adminGetAllUsers,
  transferMoney, setupRealtimeSync, uploadFile
}
