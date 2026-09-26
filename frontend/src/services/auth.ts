import { createClient, type Session } from '@supabase/supabase-js'

const viteEnv = (import.meta as any).env || {}
const supabaseUrl = viteEnv.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  return supabase
}

export async function signIn(email: string, password: string) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signUp(name: string, email: string, password: string, role: 'PATIENT' | 'CAREGIVER') {
  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: name, role } },
  })
  if (error) throw error
  return data.session
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getAccessToken(): Promise<string> {
  return (await getSession())?.access_token || ''
}
