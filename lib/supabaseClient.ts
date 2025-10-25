// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Criar a conexão com o Supabase
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
