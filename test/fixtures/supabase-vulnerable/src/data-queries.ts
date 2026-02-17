/**
 * Data query functions demonstrating PostgREST filter abuse patterns
 * These patterns can be used for data enumeration attacks
 * Reference: https://deepstrike.io/blog/hacking-thousands-of-misconfigured-supabase-instances-at-scale
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// ============================================
// ISSUE: Unfiltered select(*) (supa-api-001)
// Without RLS, this exposes all rows
// ============================================

// Dangerous: fetches ALL users
export async function getAllUsers() {
  const { data } = await supabase.from('users').select('*')
  return data
}

// Dangerous: select() defaults to *
export async function getProfiles() {
  const { data } = await supabase.from('profiles').select()
  return data
}

// ============================================
// ISSUE: Dangerous filter patterns (supa-api-002)
// These can be abused for enumeration
// ============================================

// Dangerous: neq can enumerate by exclusion
export async function getActiveUsers() {
  const { data } = await supabase
    .from('users')
    .select('*')
    .neq('status', 'disabled')  // Returns all non-disabled users
  return data
}

// Dangerous: ilike with wildcards enables fuzzy enumeration
export async function searchUsers(query: string) {
  const { data } = await supabase
    .from('users')
    .select('email, name')
    .ilike('email', '%' + query + '%')  // Attacker can probe for emails
  return data
}

// Dangerous: OR with neq enables complex enumeration
export async function getComplexFilter() {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .or('neq.status.draft,neq.status.archived')  // Gets all published posts
  return data
}

// ============================================
// Safe patterns (should NOT trigger)
// ============================================

// Safe: filtered by user ID
export async function getMyPosts(userId: string) {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
  return data
}

// Safe: specific columns, filtered by ID
export async function getUserById(id: string) {
  const { data } = await supabase
    .from('users')
    .select('id, name, avatar_url')
    .eq('id', id)
    .single()
  return data
}

// Safe: RPC function with server-side filtering
export async function getRecommendations() {
  const { data } = await supabase.rpc('get_user_recommendations')
  return data
}
