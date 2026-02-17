/**
 * RED TEAM: Client-side bypass attempts
 * Trying to hide service_role keys and dangerous patterns
 */

// BYPASS #1: Base64 encoded service_role key
const encodedKey = 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5ObGNuWnBZMlZmY205c1pTSXNJbkp2YkdVaU9pSnpaWEoyYVdObFgzSnZiR1VpTENKcFlYUWlPakUyT0RBeU1qUXdNREFzSW1WNGNDSTZNVGN4TXpjMk1EQXdNSDA';
const serviceKey = atob(encodedKey);

// BYPASS #2: Building key from parts
const keyPart1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const keyPart2 = '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSI';
const keyPart3 = 'sInJvbGUiOiJzZXJ2aWNlX3JvbGUifQ.secret';
const constructedKey = keyPart1 + keyPart2 + keyPart3;

// BYPASS #3: Key from environment with fallback to hardcoded
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.hardcoded';

// BYPASS #4: Obfuscated variable names
const _0x4a2f = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.key';
const supabaseServiceRoleKey = _0x4a2f;

// BYPASS #5: Key in template literal
const getKey = () => `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${'eyJyb2xlIjoic2VydmljZV9yb2xlIn0'}.signature`;

// BYPASS #6: Hex encoded
const hexKey = '\x65\x79\x4a\x68\x62\x47\x63\x69'; // "eyJhbGci"

// BYPASS #7: Character code array
const keyChars = [101, 121, 74, 104, 98, 71, 99, 105]; // "eyJhbGci"
const keyFromChars = String.fromCharCode(...keyChars);

// BYPASS #8: Reversed string
const reversedKey = '}.eloR_ecivres{.}TWJ:pyT,652SH:gla{yje'.split('').reverse().join('');

// BYPASS #9: Service role in comment (might be parsed by some tools)
// SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.key

// BYPASS #10: Using import.meta.env (Vite-style)
const viteKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// BYPASS #11: Dynamic property access
const config = { 'supabase-service-role': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role' };
const dynamicKey = config['supabase' + '-service-' + 'role'];

// BYPASS #12: Fetch pattern that dumps all data
async function exfiltrateData(supabase: any) {
  // Doesn't use .select('*') directly
  const columns = '*';
  const { data } = await supabase.from('users').select(columns);
  return data;
}

// BYPASS #13: Using .rpc() to bypass client-side filters
async function bypassRLS(supabase: any) {
  // RPC functions might have SECURITY DEFINER
  const { data } = await supabase.rpc('get_all_users_admin');
  return data;
}

// BYPASS #14: Indirect table access via variable
async function stealthQuery(supabase: any, targetTable: string) {
  // Table name is dynamic, hard to analyze
  const { data } = await supabase.from(targetTable).select('*');
  return data;
}

// BYPASS #15: REST API directly (bypassing supabase-js)
async function directRESTAccess(projectUrl: string, serviceKey: string) {
  const response = await fetch(`${projectUrl}/rest/v1/users?select=*`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    }
  });
  return response.json();
}

export {
  encodedKey, constructedKey, SUPABASE_KEY,
  exfiltrateData, bypassRLS, stealthQuery, directRESTAccess
};
