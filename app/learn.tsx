import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { router } from 'expo-router'
import { Colors, Typography, Spacing, BorderRadius, AuraColors, AuraColorKey, ChakraInfo } from '@/constants/theme'
import { BottomNav } from './index'

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

// ─── Color detail modal-ish panel ─────────────────────────────────────────────

const COLOR_DETAILS: Record<AuraColorKey, {
  meaning: string
  qualities: string[]
  challenges: string[]
  famous: string
  affirmation: string
}> = {
  red: {
    meaning: 'The Red aura radiates raw life force — primal, physical, and immediate. It signals a strong connection to the material world, the body, and the ancient survival drive encoded in every cell.',
    qualities: ['Vitality', 'Courage', 'Groundedness', 'Physical strength', 'Protection of loved ones'],
    challenges: ['Aggression', 'Materialism', 'Stubbornness', 'Fear-based control'],
    famous: 'Athletes at peak performance, soldiers, pioneers, and anyone who leads with their body.',
    affirmation: 'I am safe. I am grounded. My body is sacred and strong.',
  },
  orange: {
    meaning: 'Orange auras flow with creative life energy — the sexual-creative force that births art, children, ideas, and emotional connection. This is the color of the sacred womb of creativity.',
    qualities: ['Creativity', 'Sensuality', 'Emotional intelligence', 'Playfulness', 'Adaptability'],
    challenges: ['Emotional overwhelm', 'Addictive patterns', 'Difficulty with boundaries'],
    famous: 'Artists, dancers, musicians, therapists, and anyone whose work flows from feeling.',
    affirmation: 'I allow creativity to flow through me. I embrace all of my emotions.',
  },
  yellow: {
    meaning: 'Yellow is the aura of solar power — the blazing disc of personal will, confidence, and manifestation. Those with strong yellow fields can literally transform thought into physical reality.',
    qualities: ['Personal power', 'Confidence', 'Optimism', 'Intelligence', 'Manifestation ability'],
    challenges: ['Perfectionism', 'Control issues', 'Manipulation', 'Ego inflation'],
    famous: 'Entrepreneurs, leaders, professors, inventors — those who build worlds.',
    affirmation: 'I stand in my power. My will and the universe\'s will are one.',
  },
  green: {
    meaning: 'Green auras pulse with heart energy — unconditional love, healing, and the recognition of oneself in all others. This is the bridge between the lower physical chakras and the higher spiritual ones.',
    qualities: ['Unconditional love', 'Healing ability', 'Compassion', 'Forgiveness', 'Natural harmony'],
    challenges: ['Giving beyond capacity', 'Martyrdom', 'Difficulty receiving', 'Codependency'],
    famous: 'Healers, nurses, therapists, teachers, and anyone who lives to serve.',
    affirmation: 'I give from fullness. I receive love as freely as I give it.',
  },
  blue: {
    meaning: 'Blue auras carry the frequency of truth — authentic expression, clear communication, and the courage to speak what others fear to name. The throat is where the spirit enters language.',
    qualities: ['Authentic expression', 'Clarity', 'Trustworthiness', 'Teaching ability', 'Integrity'],
    challenges: ['Fear of speaking truth', 'Intellectualization', 'Rigidity', 'Oversharing'],
    famous: 'Writers, speakers, singers, lawyers, journalists — keepers of the word.',
    affirmation: 'I speak my truth with love and clarity. My voice matters.',
  },
  indigo: {
    meaning: 'Indigo marks the seer — one who perceives reality beyond the five senses. Deep indigo fields indicate access to intuitive knowing that precedes logical understanding.',
    qualities: ['Intuition', 'Psychic sensitivity', 'Pattern recognition', 'Visionary thinking', 'Deep inner knowing'],
    challenges: ['Disconnection from practical reality', 'Information overwhelm', 'Isolation', 'Analysis paralysis'],
    famous: 'Prophets, psychics, scientists of genius, and those who dream true.',
    affirmation: 'I trust my inner knowing. My intuition is a gift, not a burden.',
  },
  violet: {
    meaning: 'Violet is the rarest aura signature — the crown frequency of unity consciousness, where the individual self begins to dissolve into something larger. Those with violet fields are here to serve the whole.',
    qualities: ['Spiritual connection', 'Transcendence', 'Universal love', 'Mystical experience', 'Service to humanity'],
    challenges: ['Impracticality', 'Spiritual bypassing', 'Disconnection from body', 'Messiah complex'],
    famous: 'Mystics, saints, shamans, and those who remember what most have forgotten.',
    affirmation: 'I am a channel for divine light. My presence serves the whole.',
  },
}

function ColorCard({ colorKey }: { colorKey: AuraColorKey }) {
  const [expanded, setExpanded] = useState(false)
  const info = AuraColors.find(c => c.key === colorKey)!
  const detail = COLOR_DETAILS[colorKey]

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(e => !e)
  }

  return (
    <TouchableOpacity
      style={[colorCardStyles.container, { borderLeftColor: info.hex }]}
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={`${info.label}, ${info.chakra}, tap to ${expanded ? 'collapse' : 'expand'}`}
      accessibilityState={{ expanded }}
      activeOpacity={0.85}
    >
      <View style={colorCardStyles.header}>
        <View style={[colorCardStyles.swatch, { backgroundColor: info.hex }]} />
        <View style={colorCardStyles.headerText}>
          <Text style={[colorCardStyles.colorName, { color: info.hex }]}>{info.label}</Text>
          <Text style={colorCardStyles.chakraLabel}>{info.chakra} · {info.trait}</Text>
        </View>
        <Text style={[colorCardStyles.chevron, { color: info.hex }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </View>

      {expanded && (
        <View style={colorCardStyles.detail}>
          <Text style={colorCardStyles.meaning}>{detail.meaning}</Text>

          <View style={colorCardStyles.subsection}>
            <Text style={[colorCardStyles.subhead, { color: info.hex }]}>Qualities</Text>
            {detail.qualities.map((q, i) => (
              <Text key={i} style={colorCardStyles.bullet}>◆  {q}</Text>
            ))}
          </View>

          <View style={colorCardStyles.subsection}>
            <Text style={[colorCardStyles.subhead, { color: Colors.aura.red }]}>Challenges</Text>
            {detail.challenges.map((c, i) => (
              <Text key={i} style={colorCardStyles.bullet}>◇  {c}</Text>
            ))}
          </View>

          <View style={[colorCardStyles.affirmationBlock, { backgroundColor: info.hex + '15' }]}>
            <Text style={[colorCardStyles.affirmationLabel, { color: info.hex }]}>Affirmation</Text>
            <Text style={colorCardStyles.affirmation}>"{detail.affirmation}"</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  )
}

const colorCardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  colorName: {
    ...Typography.h3,
    fontWeight: '700',
  },
  chakraLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  chevron: {
    fontSize: 12,
    marginRight: Spacing.sm,
  },
  detail: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  meaning: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 26,
  },
  subsection: {
    gap: Spacing.sm,
  },
  subhead: {
    ...Typography.labelLarge,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  bullet: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  affirmationBlock: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  affirmationLabel: {
    ...Typography.label,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  affirmation: {
    ...Typography.serif,
    color: Colors.text,
  },
})

// ─── Info section ─────────────────────────────────────────────────────────────

function InfoSection({ title, symbol, children }: { title: string; symbol: string; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={infoStyles.section}>
      <View style={infoStyles.header}>
        <Text style={infoStyles.symbol}>{symbol}</Text>
        <Text style={infoStyles.title}>{title}</Text>
      </View>
      <View style={infoStyles.body}>{children}</View>
    </Animated.View>
  )
}

const infoStyles = StyleSheet.create({
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  symbol: {
    fontSize: 16,
    color: Colors.aura.violet,
  },
  title: {
    ...Typography.labelLarge,
    color: Colors.gold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
})

// ─── The 7 Aura Layers ───────────────────────────────────────────────────────

const AURA_LAYERS = [
  { num: 1, name: 'Etheric Body', color: '#E53E3E', desc: 'Closest to the physical body, 1–2 inches out. Carries a blueprint of the body\'s vitality. Seen as a pale blue or grey haze.' },
  { num: 2, name: 'Emotional Body', color: '#DD6B20', desc: 'Extends 1–3 inches. Fluctuates with feelings and moods. Often appears as clouds of color that shift rapidly.' },
  { num: 3, name: 'Mental Body', color: '#D69E2E', desc: 'Extends 3–8 inches. Bright yellow when thinking is clear and active. Contains thought patterns and mental structures.' },
  { num: 4, name: 'Astral Body', color: '#38A169', desc: 'Extends 6 inches to 1 foot. The bridge between the physical and spiritual. Fills with rosy pink in states of love.' },
  { num: 5, name: 'Etheric Template', color: '#3182CE', desc: 'Extends 1.5–2 feet. The blueprint of the etheric body on a higher plane. Contains the template of perfect health.' },
  { num: 6, name: 'Celestial Body', color: '#553C9A', desc: 'Extends 2–2.5 feet. The realm of spiritual ecstasy and unconditional love. Appears as shimmering pastel light.' },
  { num: 7, name: 'Ketheric Template', color: '#805AD5', desc: 'Extends 2.5–3.5 feet. The highest frequency layer. Contains the entire life plan and soul\'s purpose. Appears as golden-silver light.' },
]

// ─── Learn Screen ─────────────────────────────────────────────────────────────

export default function LearnScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Learn</Text>
          <Text style={styles.subtitle}>The science and tradition of auras</Text>
        </View>

        {/* What is an aura */}
        <InfoSection title="What is an Aura?" symbol="◉">
          <Text style={bodyStyles.text}>
            An aura is the electromagnetic energy field that surrounds all living things. While the concept appears across every mystical tradition on Earth, modern physics has given it empirical grounding.
          </Text>
          <Text style={bodyStyles.text}>
            In 1939, Soviet researcher Semyon Kirlian discovered that photographing objects under high-frequency electrical fields produced striking corona-like images — what became known as Kirlian photography. Later researchers found these fields changed measurably with emotional states, illness, and intention.
          </Text>
          <Text style={bodyStyles.text}>
            The Theosophical tradition, developed by Helena Blavatsky and later detailed by clairvoyant Charles Leadbeater in "The Chakras" (1927), mapped aura colors to specific psychological and spiritual states with remarkable precision — maps that modern energy healers still use today.
          </Text>
          <Text style={bodyStyles.text}>
            Contemporary science has documented that the human body emits biophotons (measurable light), generates electromagnetic fields visible with SQUID magnetometers, and communicates with other bodies via these fields at distances well beyond physical touch.
          </Text>
        </InfoSection>

        {/* The 7 layers */}
        <InfoSection title="The 7 Layers of the Aura" symbol="◈">
          {AURA_LAYERS.map(layer => (
            <View key={layer.num} style={layerStyles.row}>
              <View style={[layerStyles.num, { backgroundColor: layer.color + '22', borderColor: layer.color }]}>
                <Text style={[layerStyles.numText, { color: layer.color }]}>{layer.num}</Text>
              </View>
              <View style={layerStyles.layerContent}>
                <Text style={[layerStyles.layerName, { color: layer.color }]}>{layer.name}</Text>
                <Text style={layerStyles.layerDesc}>{layer.desc}</Text>
              </View>
            </View>
          ))}
        </InfoSection>

        {/* Color meanings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>◉  Aura Colors — Tap to Explore</Text>
        </View>
        {AuraColors.map(c => (
          <ColorCard key={c.key} colorKey={c.key as AuraColorKey} />
        ))}

        {/* How to see auras */}
        <InfoSection title="How to See Auras" symbol="✦">
          <Text style={bodyStyles.text}>
            Anyone can develop the ability to see auras with practice. The aura is perceived through peripheral vision — looking slightly past the person rather than directly at them.
          </Text>
          <View style={bodyStyles.steps}>
            {[
              { step: '1', text: 'Have the person stand against a plain white or pale wall in soft, indirect lighting.' },
              { step: '2', text: 'Soften your gaze. Look at a point about 2 inches from their head or shoulder, not directly at them.' },
              { step: '3', text: 'Maintain the soft focus for 30–60 seconds. A faint haze may appear first — this is the etheric layer.' },
              { step: '4', text: 'As sensitivity develops, colors begin to appear. Yellow and white are easiest for beginners. Violet is rarest.' },
              { step: '5', text: 'Practice daily. The skill develops over weeks. Keep a journal of what you perceive.' },
            ].map(s => (
              <View key={s.step} style={bodyStyles.stepRow}>
                <View style={bodyStyles.stepNum}>
                  <Text style={bodyStyles.stepNumText}>{s.step}</Text>
                </View>
                <Text style={bodyStyles.stepText}>{s.text}</Text>
              </View>
            ))}
          </View>
        </InfoSection>

        {/* Find a professional aura photographer */}
        <TouchableOpacity
          style={learnCtaStyles.cta}
          onPress={() => router.push('/find-photographer')}
          accessibilityRole="link"
          accessibilityLabel="Find a professional aura photographer"
          activeOpacity={0.85}
        >
          <Text style={learnCtaStyles.ctaTitle}>Want it photographed?</Text>
          <Text style={learnCtaStyles.ctaBody}>
            Find a verified professional aura photographer near you →
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <BottomNav active="learn" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? Spacing.xl + Spacing.md : Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  sectionHeader: {
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})

const bodyStyles = StyleSheet.create({
  text: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 26,
  },
  steps: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.aura.violet + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    ...Typography.label,
    color: Colors.aura.violet,
    fontWeight: '700',
  },
  stepText: {
    ...Typography.body,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 24,
  },
})

const learnCtaStyles = StyleSheet.create({
  cta: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
    backgroundColor: 'rgba(201,168,76,0.06)',
    alignItems: 'center',
    gap: 4,
  },
  ctaTitle: {
    ...Typography.h3,
    color: Colors.gold,
  },
  ctaBody: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
})

const layerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  num: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  numText: {
    ...Typography.label,
    fontWeight: '700',
  },
  layerContent: {
    flex: 1,
    gap: 4,
  },
  layerName: {
    ...Typography.body,
    fontWeight: '700',
  },
  layerDesc: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    lineHeight: 20,
  },
})
