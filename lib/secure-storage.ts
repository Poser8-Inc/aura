// lib/secure-storage.ts — native Supabase storage adapter backed by expo-secure-store.
// The `.web.ts` sibling overrides this on web (localStorage-backed).

import * as SecureStore from 'expo-secure-store';

export const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
