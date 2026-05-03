import Anthropic from 'npm:@anthropic-ai/sdk@0.27.3'

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

// ─── Build prompt for camera/vision path ─────────────────────────────────────

function buildVisionPrompt(): string {
  return `You are analyzing a selfie photo to read the person's aura.

Analyze the following subtle physical cues that correlate with aura state:
- Skin tone and luminosity (vitality, prana levels)
- Eye brightness, focus, and depth (consciousness, clarity)
- Facial muscle tension vs. relaxation (stress, peace)
- Overall posture and bearing visible in the face
- Color temperature and warmth of the skin
- Micro-expressions and emotional quality
- The energetic quality of their gaze

Based on these physical indicators, determine their dominant aura color and complete profile.

Then provide a reading using this JSON structure (no markdown):
{
  "profile": {
    "primaryColor": "one of: red|orange|yellow|green|blue|indigo|violet",
    "secondaryColor": "one of: red|orange|yellow|green|blue|indigo|violet",
    "tertiaryColor": "one of: red|orange|yellow|green|blue|indigo|violet",
    "chakraStatus": [
      {"chakra": "root", "status": "balanced", "score": 65},
      {"chakra": "sacral", "status": "open", "score": 72},
      {"chakra": "solarPlexus", "status": "balanced", "score": 58},
      {"chakra": "heart", "status": "open", "score": 78},
      {"chakra": "throat", "status": "weak", "score": 42},
      {"chakra": "thirdEye", "status": "radiant", "score": 88},
      {"chakra": "crown", "status": "open", "score": 71}
    ],
    "primaryTraits": ["trait1", "trait2", "trait3"],
    "energyLevel": "one of: depleted|building|balanced|overflowing",
    "dominantTheme": "brief poetic theme description",
    "answersHash": "Aura Camera Reading"
  },
  "reading": {
    "energyField": ["paragraph1", "paragraph2", "paragraph3"],
    "strengths": ["strength1", "strength2", "strength3", "strength4"],
    "blocks": ["block1", "block2"],
    "chakraInsights": "paragraph about chakra pattern",
    "guidance": {
      "practices": ["practice1", "practice2", "practice3"],
      "colors": ["color-advice1", "color-advice2"],
      "crystals": ["crystal1", "crystal2"]
    }
  }
}

Be specific to what you observe in THIS person's face. Make them feel truly seen.`
}

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
      // Vision path — send selfie to Claude
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: body.imageBase64,
                },
              },
              {
                type: 'text',
                text: buildVisionPrompt(),
              },
            ],
          },
        ],
      })
      responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const parsed = JSON.parse(responseText)
      return new Response(JSON.stringify(parsed), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })

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
