// Aura synthesis — "drift" / "Whoa what happened there?" artifact.
//
// Triggered automatically after a reading is saved if the user has a
// complementary-source reading from the last 24h. Stored as its own record
// type alongside AuraRecord in AsyncStorage so it can be rendered as a
// distinct card in the History list.

import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuraProfile } from './auraGenerator'
import { getAccessToken } from './supabase'
import { log } from './log'

const STORAGE_KEY = 'aura_syntheses_v1'
const HISTORY_KEY = 'aura_readings_v1'   // mirror of the key in app/history.tsx
const WINDOW_MS = 24 * 60 * 60 * 1000

export interface AuraSynthesis {
  id: string
  createdAt: string
  questionnaireRecordId: string
  cameraRecordId: string
  mode: 'drift' | 'shock'
  narrative: string
}

// Reads the existing reading history and returns the most recent record of
// each source type, IF both are within the 24h window relative to `now`.
// Returns null if synthesis isn't applicable yet.
async function findEligiblePair(now: Date): Promise<{
  qRecord: { id: string; profile: AuraProfile; createdAt: string }
  cRecord: { id: string; profile: AuraProfile; createdAt: string }
} | null> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY)
    if (!raw) return null
    const records: Array<{ id: string; profile: AuraProfile; source: 'questionnaire' | 'camera'; createdAt: string }> =
      JSON.parse(raw)
    const cutoff = now.getTime() - WINDOW_MS
    const recent = records.filter((r) => new Date(r.createdAt).getTime() >= cutoff)
    const q = recent.find((r) => r.source === 'questionnaire')
    const c = recent.find((r) => r.source === 'camera')
    if (!q || !c) return null
    return { qRecord: q, cRecord: c }
  } catch (e) {
    log.warn('[synthesis] findEligiblePair failed:', e)
    return null
  }
}

// Has a synthesis already been saved for this exact (questionnaire, camera)
// pair? Avoid regenerating the same artifact every time the user re-opens
// a result page within the window.
async function existingSynthesisFor(qId: string, cId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const items: AuraSynthesis[] = JSON.parse(raw)
    return items.some((s) => s.questionnaireRecordId === qId && s.cameraRecordId === cId)
  } catch {
    return false
  }
}

async function saveSynthesis(s: AuraSynthesis): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const existing: AuraSynthesis[] = raw ? JSON.parse(raw) : []
    const updated = [s, ...existing].slice(0, 30) // keep last 30
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    log.warn('[synthesis] save failed:', e)
  }
}

export async function loadSyntheses(): Promise<AuraSynthesis[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Public entry — call from aura-result.tsx after a reading is saved.
// Best-effort: errors are swallowed (logged), the user's primary reading
// experience must not depend on this succeeding.
export async function maybeGenerateSynthesis(): Promise<AuraSynthesis | null> {
  const pair = await findEligiblePair(new Date())
  if (!pair) return null

  if (await existingSynthesisFor(pair.qRecord.id, pair.cRecord.id)) {
    log.debug('[synthesis] already exists for this pair, skipping')
    return null
  }

  const oracleUrl = process.env.EXPO_PUBLIC_AURA_ORACLE_URL
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  if (!oracleUrl || !anonKey) {
    log.warn('[synthesis] oracle URL or anon key missing; skipping')
    return null
  }

  try {
    const token = await getAccessToken()
    const resp = await fetch(oracleUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'synthesis',
        questionnaireProfile: pair.qRecord.profile,
        cameraProfile: pair.cRecord.profile,
      }),
    })
    if (!resp.ok) {
      log.warn('[synthesis] oracle returned', resp.status)
      return null
    }
    const data: { mode?: 'drift' | 'shock'; narrative?: string } = await resp.json()
    if (!data.mode || !data.narrative) {
      log.warn('[synthesis] oracle response missing fields:', data)
      return null
    }

    const synth: AuraSynthesis = {
      id: `syn_${Date.now()}`,
      createdAt: new Date().toISOString(),
      questionnaireRecordId: pair.qRecord.id,
      cameraRecordId: pair.cRecord.id,
      mode: data.mode,
      narrative: data.narrative,
    }
    await saveSynthesis(synth)
    return synth
  } catch (e) {
    log.warn('[synthesis] generate failed:', e)
    return null
  }
}
