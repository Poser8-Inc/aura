import { AuraColorKey, ChakraKey } from '@/constants/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuestionnaireAnswer {
  questionIndex: number
  answerIndex: number
}

export interface ChakraStatus {
  chakra: ChakraKey
  status: 'blocked' | 'weak' | 'balanced' | 'open' | 'radiant'
  score: number // 0–100
}

export interface AuraProfile {
  primaryColor: AuraColorKey
  secondaryColor: AuraColorKey
  tertiaryColor: AuraColorKey
  chakraStatus: ChakraStatus[]
  primaryTraits: string[]
  energyLevel: 'depleted' | 'building' | 'balanced' | 'overflowing'
  dominantTheme: string
  answersHash: string // For Claude prompt context
}

// ─── Question → Chakra weight mappings ───────────────────────────────────────
// Each answer pushes weight toward specific chakras.
// Format: [root, sacral, solarPlexus, heart, throat, thirdEye, crown] delta

const ANSWER_WEIGHTS: Record<number, number[][]> = {
  // Q1: "How do you feel right now?"
  // Exhausted / Tired / Neutral / Energized / Electric
  0: [
    [15, 10,  5,  0,  0, -5, -5],  // Exhausted → root heavy
    [ 8,  5,  5,  5,  0,  0, -5],  // Tired
    [ 5,  5,  5,  5,  5,  5,  5],  // Neutral → even
    [ 0,  5,  8, 10,  8,  5,  5],  // Energized → heart/solar
    [ 0,  5,  5,  5, 10,  5, 15],  // Electric → crown/throat
  ],
  // Q2: "When you walk into a room..."
  // Observe quietly / Adapt to the vibe / Bring the energy / Connect one-on-one
  1: [
    [ 0,  0,  0,  5,  0, 15, 10],  // Observe → thirdEye/crown
    [ 5,  8,  5, 10,  8,  0,  0],  // Adapt → sacral/heart
    [ 0,  5, 15,  5, 15,  0,  0],  // Bring energy → solar/throat
    [ 0,  5,  5, 15,  5,  5,  5],  // Connect → heart
  ],
  // Q3: "Your greatest strength is..."
  // Intuition / Logic / Creativity / Empathy / Leadership
  2: [
    [ 0,  0,  0,  0,  0, 20, 15],  // Intuition → thirdEye/crown
    [ 0,  0, 10,  0,  5, 15,  5],  // Logic → thirdEye/solar
    [ 0, 15,  5,  5,  5,  5,  0],  // Creativity → sacral
    [ 0,  5,  0, 20,  5,  5,  5],  // Empathy → heart
    [ 5,  0, 20,  5, 15,  0,  0],  // Leadership → solar/throat
  ],
  // Q4: "You feel most alive when..."
  // In nature / Creating something / Helping others / Learning / Achieving goals
  3: [
    [15,  5,  0,  5,  0,  5, 10],  // Nature → root/crown
    [ 0, 20,  5,  5,  5,  5,  0],  // Creating → sacral
    [ 0,  0,  5, 20,  5,  0,  5],  // Helping → heart
    [ 0,  0,  5,  5,  5, 20, 10],  // Learning → thirdEye
    [ 0,  0, 20,  5,  5,  0,  5],  // Achieving → solar
  ],
  // Q5: "Your relationship with emotions is..."
  // Feel everything deeply / Think before I feel / Balance heart and mind / Stay practical
  4: [
    [ 0, 10,  0, 20,  5,  5,  5],  // Feel everything → heart/sacral
    [ 0,  0, 10,  5,  5, 20,  5],  // Think first → thirdEye/solar
    [ 5,  5,  5, 15,  5, 10, 10],  // Balance → spread
    [15,  5, 15,  0,  5,  5,  0],  // Practical → root/solar
  ],
  // Q6: "What color draws you most?" → direct aura color mapping
  // Red / Orange / Yellow / Green / Blue / Indigo / Violet
  5: [
    [25,  0,  0,  0,  0,  0,  0],  // Red → root
    [ 0, 25,  0,  0,  0,  0,  0],  // Orange → sacral
    [ 0,  0, 25,  0,  0,  0,  0],  // Yellow → solar
    [ 0,  0,  0, 25,  0,  0,  0],  // Green → heart
    [ 0,  0,  0,  0, 25,  0,  0],  // Blue → throat
    [ 0,  0,  0,  0,  0, 25,  0],  // Indigo → thirdEye
    [ 0,  0,  0,  0,  0,  0, 25],  // Violet → crown
  ],
  // Q7: "Your energy levels lately..."
  // Scattered/Depleted / Steady/Grounded / Building/Rising / Overflowing
  6: [
    [-5, -5, -5, -5, -5, -5, -5],  // Depleted → all negative (relative lowering handled below)
    [20,  5,  5, 10,  0,  5,  5],  // Grounded → root
    [ 0,  5, 15,  5, 10,  5,  5],  // Building → solar/throat
    [ 0,  5,  5, 10,  5,  5, 25],  // Overflowing → crown
  ],
  // Q8: "In conflict, you..."
  // Withdraw and reflect / Stand your ground / Seek harmony / Get fired up
  7: [
    [ 5,  0,  0,  5,  0, 15,  5],  // Withdraw → thirdEye
    [15,  0, 20,  0,  5,  0,  0],  // Stand ground → root/solar
    [ 0,  5,  0, 20,  5,  5,  5],  // Harmony → heart
    [ 5, 15, 15,  0, 10,  0,  0],  // Fired up → sacral/solar
  ],
  // Q9: "You are drawn to..."
  // Spiritual practices / Physical activity / Intellectual pursuits / Artistic expression / Service
  8: [
    [ 5,  5,  0,  5, 10, 10, 25],  // Spiritual → crown
    [20, 10,  5,  5,  0,  0,  0],  // Physical → root/sacral
    [ 0,  0, 10,  0,  5, 20,  5],  // Intellectual → thirdEye/solar
    [ 0, 20,  5,  5, 15,  5,  5],  // Artistic → sacral/throat
    [ 0,  0,  5, 20,  5,  5,  5],  // Service → heart
  ],
  // Q10: "Your life right now feels like..."
  // A storm passing / Solid ground / A journey beginning / A peak moment / A quiet river
  9: [
    [ 5, 10,  5,  5,  5,  5,  5],  // Storm → scattered, sacral
    [20,  5,  5, 10,  0,  5,  5],  // Solid → root
    [ 0, 10, 10,  5, 10,  5,  5],  // Journey → sacral/solar/throat
    [ 0,  5, 10, 10,  5,  5, 15],  // Peak → solar/heart/crown
    [10,  0,  0, 15,  0, 10, 15],  // Quiet river → root/heart/crown
  ],
}

const CHAKRA_ORDER: ChakraKey[] = [
  'root', 'sacral', 'solarPlexus', 'heart', 'throat', 'thirdEye', 'crown',
]

const CHAKRA_TO_COLOR: Record<ChakraKey, AuraColorKey> = {
  root:        'red',
  sacral:      'orange',
  solarPlexus: 'yellow',
  heart:       'green',
  throat:      'blue',
  thirdEye:    'indigo',
  crown:       'violet',
}

// ─── Trait libraries ─────────────────────────────────────────────────────────

const TRAITS_BY_COLOR: Record<AuraColorKey, string[]> = {
  red: [
    'Deeply grounded in physical reality',
    'Strong survival instincts',
    'Natural protector and provider',
    'Fierce, primal life force',
    'Connected to ancestral wisdom',
  ],
  orange: [
    'Overflowing creative energy',
    'Magnetic sensual presence',
    'Emotionally fluid and adaptive',
    'Natural artist and storyteller',
    'Draws pleasure from simple joy',
  ],
  yellow: [
    'Radiant personal power',
    'Natural leader and visionary',
    'Strong sense of self-worth',
    'Transforms ideas into reality',
    'Infectious confidence and courage',
  ],
  green: [
    'Deep capacity for unconditional love',
    'Natural healer and nurturer',
    'Sees beauty in every person',
    'Creates safe space for others',
    'Harmonizes through compassion',
  ],
  blue: [
    'Authentic and fearless self-expression',
    'Natural communicator and teacher',
    'Speaks deep truths others avoid',
    'Voice carries unusual resonance',
    'Lives by integrity and honesty',
  ],
  indigo: [
    'Sees beyond the visible',
    'Highly attuned to subtle energies',
    'Pattern recognition beyond logic',
    'Deep access to inner knowing',
    'Bridge between worlds seen and unseen',
  ],
  violet: [
    'Touched by the numinous',
    'Channel for higher wisdom',
    'Dissolves illusion of separation',
    'Cosmic perspective on human struggle',
    'Service to the greater whole',
  ],
}

const ENERGY_LEVELS: Array<AuraProfile['energyLevel']> = [
  'depleted', 'building', 'balanced', 'overflowing',
]

const DOMINANT_THEMES: Record<AuraColorKey, string> = {
  red:    'Embodiment & Survival',
  orange: 'Creation & Flow',
  yellow: 'Power & Manifestation',
  green:  'Love & Healing',
  blue:   'Truth & Expression',
  indigo: 'Vision & Intuition',
  violet: 'Transcendence & Unity',
}

// ─── Core generator ───────────────────────────────────────────────────────────

export function generateAuraFromAnswers(answers: QuestionnaireAnswer[]): AuraProfile {
  // Start with neutral baseline for each chakra
  const scores: number[] = [50, 50, 50, 50, 50, 50, 50]

  for (const { questionIndex, answerIndex } of answers) {
    const weights = ANSWER_WEIGHTS[questionIndex]
    if (!weights) continue
    const deltas = weights[answerIndex]
    if (!deltas) continue
    for (let i = 0; i < 7; i++) {
      scores[i] = Math.max(0, Math.min(100, scores[i] + deltas[i]))
    }
  }

  // Build chakra status list
  const chakraStatus: ChakraStatus[] = CHAKRA_ORDER.map((chakra, i) => ({
    chakra,
    score: scores[i],
    status: scoreToStatus(scores[i]),
  }))

  // Rank chakras to determine aura colors
  const ranked = [...chakraStatus].sort((a, b) => b.score - a.score)

  const primaryColor   = CHAKRA_TO_COLOR[ranked[0].chakra]
  const secondaryColor = CHAKRA_TO_COLOR[ranked[1].chakra]
  const tertiaryColor  = CHAKRA_TO_COLOR[ranked[2].chakra]

  // Pick 3 traits from primary color pool
  const traitPool = TRAITS_BY_COLOR[primaryColor]
  // Use the answer hash to pick deterministically
  const hash = simpleHash(answers)
  const primaryTraits = [
    traitPool[hash % traitPool.length],
    traitPool[(hash + 1) % traitPool.length],
    traitPool[(hash + 2) % traitPool.length],
  ]

  // Energy level from Q7 answer or derived from average
  const energyAnswer = answers.find(a => a.questionIndex === 6)
  let energyLevel: AuraProfile['energyLevel']
  if (energyAnswer !== undefined) {
    energyLevel = ENERGY_LEVELS[Math.min(energyAnswer.answerIndex, 3)]
  } else {
    const avg = scores.reduce((s, v) => s + v, 0) / 7
    if (avg < 35) energyLevel = 'depleted'
    else if (avg < 55) energyLevel = 'building'
    else if (avg < 75) energyLevel = 'balanced'
    else energyLevel = 'overflowing'
  }

  const answersHash = buildAnswersDescription(answers)

  return {
    primaryColor,
    secondaryColor,
    tertiaryColor,
    chakraStatus,
    primaryTraits,
    energyLevel,
    dominantTheme: DOMINANT_THEMES[primaryColor],
    answersHash,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToStatus(score: number): ChakraStatus['status'] {
  if (score < 20) return 'blocked'
  if (score < 40) return 'weak'
  if (score < 60) return 'balanced'
  if (score < 80) return 'open'
  return 'radiant'
}

function simpleHash(answers: QuestionnaireAnswer[]): number {
  return answers.reduce((acc, a) => acc * 31 + a.answerIndex, 17) >>> 0
}

function buildAnswersDescription(answers: QuestionnaireAnswer[]): string {
  // Human-readable summary of answers to pass to Claude for richer context
  const Q_LABELS = [
    'Energy right now',
    'Room presence',
    'Greatest strength',
    'Feels most alive',
    'Emotional relationship',
    'Drawn color',
    'Energy levels',
    'In conflict',
    'Drawn to',
    'Life feels like',
  ]
  const A_LABELS: Record<number, string[]> = {
    0: ['Exhausted', 'Tired', 'Neutral', 'Energized', 'Electric'],
    1: ['Observe quietly', 'Adapt to vibe', 'Bring the energy', 'Connect one-on-one'],
    2: ['Intuition', 'Logic', 'Creativity', 'Empathy', 'Leadership'],
    3: ['In nature', 'Creating something', 'Helping others', 'Learning', 'Achieving goals'],
    4: ['Feel everything deeply', 'Think before I feel', 'Balance heart and mind', 'Stay practical'],
    5: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'],
    6: ['Scattered/Depleted', 'Steady/Grounded', 'Building/Rising', 'Overflowing'],
    7: ['Withdraw and reflect', 'Stand your ground', 'Seek harmony', 'Get fired up'],
    8: ['Spiritual practices', 'Physical activity', 'Intellectual pursuits', 'Artistic expression', 'Service to others'],
    9: ['A storm passing', 'Solid ground', 'A journey beginning', 'A peak moment', 'A quiet river'],
  }
  return answers
    .map(a => `${Q_LABELS[a.questionIndex]}: ${A_LABELS[a.questionIndex]?.[a.answerIndex] ?? a.answerIndex}`)
    .join('; ')
}
