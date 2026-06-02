import Anthropic from 'npm:@anthropic-ai/sdk@0.27.3'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Auth: validate the Bearer token server-side via Supabase admin so we never
// trust a userId from the request body. Anonymous Supabase users (created by
// signInAnonymously on first launch) are fine — they have a real UUID — but
// unauthenticated callers are rejected.
async function authenticateRequest(req: Request): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: number; body: { error: string; code: string } }
> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, body: { error: 'Missing Authorization bearer', code: 'NO_AUTH' } }
  }
  const token = authHeader.slice(7)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, status: 500, body: { error: 'Auth misconfigured', code: 'AUTH_CONFIG' } }
  }
  const admin = createClient(supabaseUrl, serviceKey)
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data?.user) {
    return { ok: false, status: 401, body: { error: 'Invalid session', code: 'INVALID_AUTH' } }
  }
  return { ok: true, userId: data.user.id }
}

// ─── Types (mirrored from client) ─────────────────────────────────────────────

interface ChakraStatus {
  chakra: string
  status: 'blocked' | 'weak' | 'balanced' | 'open' | 'radiant'
  score: number
}

interface AuraProfile {
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  chakraStatus: ChakraStatus[]
  primaryTraits: string[]
  energyLevel: 'depleted' | 'building' | 'balanced' | 'overflowing'
  dominantTheme: string
  answersHash: string
}

interface AuraReading {
  energyField: string[]
  strengths: string[]
  blocks: string[]
  chakraInsights: string
  guidance: {
    practices: string[]
    colors: string[]
    crystals: string[]
  }
}

// ─── Color lookup ─────────────────────────────────────────────────────────────

const COLOR_NAMES: Record<string, string> = {
  red:    'Red (Root)',
  orange: 'Orange (Sacral)',
  yellow: 'Yellow (Solar Plexus)',
  green:  'Green (Heart)',
  blue:   'Blue (Throat)',
  indigo: 'Indigo (Third Eye)',
  violet: 'Violet (Crown)',
}

const CHAKRA_ORDER = ['root','sacral','solarPlexus','heart','throat','thirdEye','crown'] as const
const CHAKRA_TO_COLOR: Record<string,string> = {
  root: 'red', sacral: 'orange', solarPlexus: 'yellow', heart: 'green',
  throat: 'blue', thirdEye: 'indigo', crown: 'violet',
}
const TRAITS_BY_COLOR: Record<string,string[]> = {
  red: ['Deeply grounded in physical reality','Strong survival instincts','Natural protector and provider','Fierce, primal life force','Connected to ancestral wisdom'],
  orange: ['Overflowing creative energy','Magnetic sensual presence','Emotionally fluid and adaptive','Natural artist and storyteller','Draws pleasure from simple joy'],
  yellow: ['Radiant personal power','Natural leader and visionary','Strong sense of self-worth','Transforms ideas into reality','Infectious confidence and courage'],
  green: ['Deep capacity for unconditional love','Natural healer and nurturer','Sees beauty in every person','Creates safe space for others','Harmonizes through compassion'],
  blue: ['Authentic and fearless self-expression','Natural communicator and teacher','Speaks deep truths others avoid','Voice carries unusual resonance','Lives by integrity and honesty'],
  indigo: ['Sees beyond the visible','Highly attuned to subtle energies','Pattern recognition beyond logic','Deep access to inner knowing','Bridge between worlds seen and unseen'],
  violet: ['Touched by the numinous','Channel for higher wisdom','Dissolves illusion of separation','Cosmic perspective on human struggle','Service to the greater whole'],
}
const DOMINANT_THEMES: Record<string,string> = {
  red: 'Embodiment & Survival', orange: 'Creation & Flow',
  yellow: 'Power & Manifestation', green: 'Love & Healing',
  blue: 'Truth & Expression', indigo: 'Vision & Intuition',
  violet: 'Transcendence & Unity',
}
const ENERGY_LEVELS = ['depleted','building','balanced','overflowing'] as const

/**
 * Build a deterministic AuraProfile from the SHA-256 of an image. Same image
 * always yields the same profile — this is the design point. We are NOT
 * measuring aura (which is not a physical phenomenon); we are providing a
 * stable, reproducible artistic interpretation keyed to the photo.
 */
async function profileFromImageHash(imageBase64: string): Promise<AuraProfile> {
  // SHA-256 over raw image bytes. Available in Deno via Web Crypto.
  const bytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
  const hashBuf = await crypto.subtle.digest('SHA-256', bytes)
  const hash = new Uint8Array(hashBuf)

  // Derive 7 chakra scores in [0,100] from 7 hash bytes (positions 0..6).
  // Bias center to ~55 so most profiles read as "open/balanced", which
  // matches the questionnaire's neutral baseline of 50 + small deltas.
  const scores: number[] = []
  for (let i = 0; i < 7; i++) {
    const raw = hash[i] // 0..255
    scores.push(Math.max(0, Math.min(100, Math.round(20 + (raw / 255) * 70))))
  }

  const chakraStatus: ChakraStatus[] = CHAKRA_ORDER.map((chakra, i) => ({
    chakra,
    score: scores[i],
    status: scoreToStatus(scores[i]),
  }))

  const ranked = [...chakraStatus].sort((a, b) => b.score - a.score)
  const primaryColor = CHAKRA_TO_COLOR[ranked[0].chakra]
  const secondaryColor = CHAKRA_TO_COLOR[ranked[1].chakra]
  const tertiaryColor = CHAKRA_TO_COLOR[ranked[2].chakra]

  const traitPool = TRAITS_BY_COLOR[primaryColor]
  const traitSeed = hash[7] // independent byte
  const primaryTraits = [
    traitPool[traitSeed % traitPool.length],
    traitPool[(traitSeed + 1) % traitPool.length],
    traitPool[(traitSeed + 2) % traitPool.length],
  ]

  const avg = scores.reduce((s, v) => s + v, 0) / 7
  let energyLevel: AuraProfile['energyLevel']
  if (avg < 35) energyLevel = 'depleted'
  else if (avg < 55) energyLevel = 'building'
  else if (avg < 75) energyLevel = 'balanced'
  else energyLevel = 'overflowing'

  // Short hash hex for context display
  const hashHex = Array.from(hash.slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return {
    primaryColor,
    secondaryColor,
    tertiaryColor,
    chakraStatus,
    primaryTraits,
    energyLevel,
    dominantTheme: DOMINANT_THEMES[primaryColor],
    answersHash: `Artistic visualization (photo signature ${hashHex})`,
  }
}

function scoreToStatus(score: number): ChakraStatus['status'] {
  if (score < 20) return 'blocked'
  if (score < 40) return 'weak'
  if (score < 60) return 'balanced'
  if (score < 80) return 'open'
  return 'radiant'
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert in aura reading with deep knowledge of Kirlian photography research, Theosophical aura traditions (Blavatsky, Leadbeater), and modern energy healing. You write aura readings that are specific, insightful, and empowering — never generic horoscope language. Each reading should feel like it was written specifically for this person.

Your readings draw from:
- Barbara Ann Brennan's "Hands of Light" and "Light Emerging"
- Charles Leadbeater's "The Chakras"
- Rosalyn Bruyere's chakra and aura work
- Rudolf Steiner's spiritual science perspectives
- Modern bioelectromagnetics research

Style: Write with authority, warmth, and precision. Avoid vague platitudes. Be specific about the energy dynamics at play. Use vivid imagery that makes the person feel seen.

Always respond with valid JSON matching the AuraReading type exactly. No markdown, no code blocks — raw JSON only.`

// ─── Build prompt for questionnaire path ─────────────────────────────────────

function buildQuestionnairePrompt(profile: AuraProfile): string {
  const chakraReadable = profile.chakraStatus
    .map(cs => `${cs.chakra}: ${cs.status} (${cs.score}/100)`)
    .join(', ')

  return `Generate a personalized aura reading for this person.

Their aura profile:
- Primary aura color: ${COLOR_NAMES[profile.primaryColor] ?? profile.primaryColor}
- Secondary color: ${COLOR_NAMES[profile.secondaryColor] ?? profile.secondaryColor}
- Tertiary color: ${COLOR_NAMES[profile.tertiaryColor] ?? profile.tertiaryColor}
- Energy level: ${profile.energyLevel}
- Dominant theme: ${profile.dominantTheme}
- Key traits already identified: ${profile.primaryTraits.join(', ')}
- Chakra status: ${chakraReadable}

Context from their questionnaire answers: ${profile.answersHash}

Return ONLY this JSON structure (no markdown):
{
  "energyField": ["paragraph1", "paragraph2", "paragraph3"],
  "strengths": ["strength1", "strength2", "strength3", "strength4"],
  "blocks": ["block1", "block2"],
  "chakraInsights": "single paragraph about the chakra pattern",
  "guidance": {
    "practices": ["practice1", "practice2", "practice3"],
    "colors": ["color-advice1", "color-advice2"],
    "crystals": ["crystal1", "crystal2"]
  }
}

Requirements:
- energyField: 3 substantial paragraphs (100–150 words each) about their overall energy field. Be specific to THEIR colors and answers, not generic.
- strengths: 4 specific strengths visible in their aura — not traits anyone would claim, but specific to their field
- blocks: 2 specific energy blocks or shadows visible, named with honesty and compassion
- chakraInsights: insightful paragraph about what the chakra pattern reveals
- guidance: actionable, specific — not "meditate" but the specific type and approach for this field`
}

// ─── Build prompt for photo-derived reading path ─────────────────────────────
// REMOVED 2026-05-17: the prior camera prompt instructed Claude vision to read
// "aura state" from "skin tone and luminosity (vitality, prana levels), eye
// brightness, focus, and depth (consciousness, clarity)" etc. There is no
// physical phenomenon called "aura" — every controlled test has returned
// chance-level results (see CV_REPORT_2026-05-17.md), and the only EM emission
// the body produces in any imageable band is thermal IR ~9-10 μm, which a
// phone CMOS is physically blind to. Asking an LLM to "detect" an
// unmeasurable phenomenon from a selfie is a textbook Apple 1.1.6 risk
// ("False information and features... Stating that the app is 'for
// entertainment purposes' won't overcome this guideline") and an FTC
// substantiation risk (Lumosity precedent).
//
// The camera path now produces a deterministic-per-photo aura profile by
// hashing the image bytes and routing through the same chakra-weight
// generator the questionnaire uses. Same photo → same aura, every time.
// That alone beats every shipping competitor whose #1 complaint is
// "I take two photos seconds apart and get different auras."
//
// Phase 2 will add MediaPipe Selfie Segmentation + React Native Skia
// rendering for a genuinely beautiful, deterministic visual halo. The
// narrative layer (this file) stays — what changed is that it no longer
// pretends to measure anything.

// ─── Edge function handler ────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Authenticate before any work — protects against unauthenticated callers
  // burning Anthropic budget on this endpoint.
  const auth = await authenticateRequest(req)
  if (!auth.ok) {
    return new Response(JSON.stringify(auth.body), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const anthropic = new Anthropic({ apiKey })

  let body: { profile?: AuraProfile; imageBase64?: string; source?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { source = 'questionnaire' } = body

  try {
    let responseText: string

    if (source === 'camera' && body.imageBase64) {
      // Deterministic photo-derived profile. The LLM is no longer asked to
      // "detect" aura from a selfie — we hash the image bytes and use that
      // as a stable random seed feeding the same chakra-weight generator the
      // questionnaire uses. Same photo → same aura, every time. Then we
      // generate the narrative through the standard SYSTEM_PROMPT path so
      // the text quality matches the questionnaire reading.
      const photoProfile = await profileFromImageHash(body.imageBase64)

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1800,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildQuestionnairePrompt(photoProfile),
          },
        ],
      })
      responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const reading: AuraReading = JSON.parse(responseText)
      return new Response(
        JSON.stringify({ profile: photoProfile, reading }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )

    } else if (body.profile) {
      // Questionnaire path — text only
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1800,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildQuestionnairePrompt(body.profile),
          },
        ],
      })
      responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const reading: AuraReading = JSON.parse(responseText)
      return new Response(JSON.stringify({ reading }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })

    } else {
      return new Response(JSON.stringify({ error: 'Must provide profile or imageBase64' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (err) {
    console.error('Aura Oracle error:', err)
    return new Response(JSON.stringify({ error: 'Internal error', detail: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
