import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rnwgojmxlvgrtnozxmlc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJud2dvam14bHZncnRub3p4bWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjU1MjksImV4cCI6MjA2NTg0MTUyOX0._gA3hl3QP1pDNUO-4s0ilGgkXot39-G4qt3IqeDlGHw'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface RegistrationData {
  name: string
  email: string
  registration_type: 'free' | 'premium'
  phone?: string
  experience_level?: string
  motivation?: string
  tracks_interested?: string[]
  created_at?: string
}