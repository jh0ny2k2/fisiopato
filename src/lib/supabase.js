import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

export async function saveScore({ name, score, total, durationMs }) {
  if (!supabase) throw new Error('Supabase no configurado')
  const { data, error } = await supabase
    .from('scores')
    .insert({ name, score, total, duration_ms: durationMs })
    .select()
  if (error) throw error
  return data
}

export async function fetchLeaderboard() {
  if (!supabase) return { data: [] }
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .order('duration_ms', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(10)
  if (error) throw error
  return { data }
}
