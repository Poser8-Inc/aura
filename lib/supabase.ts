import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl.length === 0) {
  throw new Error(
    '[aura] EXPO_PUBLIC_SUPABASE_URL is not set. Configure it in .env (see .env.example) and restart Metro. Supabase client cannot initialize without it.'
  )
}
if (!supabaseAnonKey || supabaseAnonKey.length === 0) {
  throw new Error(
    '[aura] EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Configure it in .env (see .env.example) and restart Metro. Supabase client cannot initialize without it.'
  )
}

// SecureStore adapter for Supabase session persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
