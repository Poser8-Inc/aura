// lib/secure-storage.web.ts — web override for the Supabase storage adapter.
// expo-secure-store has no usable web shim; localStorage is the right backend.

import { log } from './log';

function read(key: string): string | null {
  try {
    return typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(key)
      : null;
  } catch (err) {
    log.warn('[aura][secure-storage.web] getItem failed:', err);
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (err) {
    log.warn('[aura][secure-storage.web] setItem failed:', err);
  }
}

function clear(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    log.warn('[aura][secure-storage.web] removeItem failed:', err);
  }
}

export const ExpoSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> { return read(key); },
  async setItem(key: string, value: string): Promise<void> { write(key, value); },
  async removeItem(key: string): Promise<void> { clear(key); },
};
