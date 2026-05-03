// Aura app color system — the aura colors ARE the brand

export const Colors = {
  // Base palette
  bg: '#07080F',
  surface: '#0F1020',
  surfaceRaised: '#171830',
  text: '#F5F0F8',
  textMuted: '#9B8FA8',
  gold: '#C9A84C',
  goldDim: '#8A6E32',
  border: '#1E1F3A',
  white: '#FFFFFF',
  black: '#000000',
  error: '#C0392B',
  success: '#27AE60',

  // The 7 chakra / aura colors
  aura: {
    red: '#E53E3E',      // Root — survival, grounding
    orange: '#DD6B20',   // Sacral — creativity, sexuality
    yellow: '#D69E2E',   // Solar Plexus — power, will
    green: '#38A169',    // Heart — love, compassion
    blue: '#3182CE',     // Throat — expression, truth
    indigo: '#553C9A',   // Third Eye — intuition, insight
    violet: '#805AD5',   // Crown — spirituality, transcendence
  },

  // Glow / translucent variants (for Skia layers)
  auraGlow: {
    red: 'rgba(229, 62, 62, 0.35)',
    orange: 'rgba(221, 107, 32, 0.35)',
    yellow: 'rgba(214, 158, 46, 0.35)',
    green: 'rgba(56, 161, 105, 0.35)',
    blue: 'rgba(49, 130, 206, 0.35)',
    indigo: 'rgba(85, 60, 154, 0.35)',
    violet: 'rgba(128, 90, 213, 0.35)',
  },
} as const

export const AuraColors = [
  { key: 'red',    hex: '#E53E3E', label: 'Red',    chakra: 'Root',        trait: 'Grounded & Vital' },
  { key: 'orange', hex: '#DD6B20', label: 'Orange', chakra: 'Sacral',      trait: 'Creative & Flowing' },
  { key: 'yellow', hex: '#D69E2E', label: 'Yellow', chakra: 'Solar Plexus',trait: 'Powerful & Confident' },
  { key: 'green',  hex: '#38A169', label: 'Green',  chakra: 'Heart',       trait: 'Loving & Healing' },
  { key: 'blue',   hex: '#3182CE', label: 'Blue',   chakra: 'Throat',      trait: 'Expressive & True' },
  { key: 'indigo', hex: '#553C9A', label: 'Indigo', chakra: 'Third Eye',   trait: 'Intuitive & Wise' },
  { key: 'violet', hex: '#805AD5', label: 'Violet', chakra: 'Crown',       trait: 'Spiritual & Transcendent' },
] as const

export type AuraColorKey = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'violet'

export const Typography = {
  display: { fontSize: 42, fontWeight: '700' as const, letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5 },
  labelLarge: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.8 },
  serif: { fontSize: 16, fontWeight: '400' as const, fontStyle: 'italic' as const, lineHeight: 26 },
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const Shadows = {
  violet: {
    shadowColor: '#805AD5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
} as const

export const ChakraInfo = {
  root:        { label: 'Root',         color: '#E53E3E', symbol: '▼', element: 'Earth' },
  sacral:      { label: 'Sacral',       color: '#DD6B20', symbol: '☽', element: 'Water' },
  solarPlexus: { label: 'Solar Plexus', color: '#D69E2E', symbol: '◉', element: 'Fire' },
  heart:       { label: 'Heart',        color: '#38A169', symbol: '✦', element: 'Air' },
  throat:      { label: 'Throat',       color: '#3182CE', symbol: '◈', element: 'Sound' },
  thirdEye:    { label: 'Third Eye',    color: '#553C9A', symbol: '◇', element: 'Light' },
  crown:       { label: 'Crown',        color: '#805AD5', symbol: '✧', element: 'Thought' },
} as const

export type ChakraKey = keyof typeof ChakraInfo
