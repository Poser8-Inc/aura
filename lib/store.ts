import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AuraProfile } from './auraGenerator'
import { log } from './log'

export interface AppState {
  readingsUsed: number
  incrementReadings: () => void
  setReadingsUsed: (n: number) => void
}

export const useStore = create<AppState>((set) => ({
  readingsUsed: 0,
  incrementReadings: () => set((s) => ({ readingsUsed: s.readingsUsed + 1 })),
  setReadingsUsed: (n) => set({ readingsUsed: n }),
}))

const ACTIVE_READING_KEY = 'aura_active_reading_v1'

export interface ActiveReading {
  profile: AuraProfile
  source: 'questionnaire' | 'camera'
  capturedBase64?: string
}

export async function setActiveReading(r: ActiveReading): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_READING_KEY, JSON.stringify(r))
  } catch (e) {
    log.warn('[aura/store] setActiveReading failed:', e)
    throw e
  }
}

export async function getActiveReading(): Promise<ActiveReading | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_READING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (!parsed.profile || typeof parsed.profile !== 'object') return null
    if (parsed.source !== 'questionnaire' && parsed.source !== 'camera') return null
    return parsed as ActiveReading
  } catch (e) {
    log.warn('[aura/store] getActiveReading failed:', e)
    return null
  }
}

export async function clearActiveReading(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVE_READING_KEY)
  } catch {
    // best-effort
  }
}
