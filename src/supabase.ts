import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttbgcqdconlqabrwnwuw.supabase.co'
const supabaseAnonKey = 'sb_publishable_UmIhXdsCDZk48QabR8e50A_3mkY5vRN'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)