import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
  Easing,
} from 'react-native-reanimated'
import { AuraOrb } from '@/components/AuraOrb'
import { Colors, Typography, Spacing, BorderRadius, AuraColors, ChakraInfo } from '@/constants/theme'
import { AuraProfile, ChakraStatus } from '@/lib/auraGenerator'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const ORB_SIZE = Math.min(SCREEN_WIDTH * 0.68, 260)

// ─── Reading state type ───────────────────────────────────────────────────────

interface AuraReading {
  energyField: string[]       // paragraphs
  strengths: string[]         // bullet items
  blocks: string[]
  chakraInsights: string
  guidance: { practices: string[]; colors: string[]; crystals: string[] }
}

// ─── Color info lookup ────────────────────────────────────────────────────────

function getColorInfo(key: string) {
  return AuraColors.find(c => c.key === key)
}

// ─── Chakra status bar ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ChakraStatus['status'], string> = {
  blocked:  '#4A4A4A',
  weak:     '#8B3A3A',
  balanced: '#3182CE',
  open:     '#38A169',
  radiant:  '#805AD5',
}

const STATUS_LABELS: Record<ChakraStatus['status'], string> = {
  blocked:  'Blocked',
  weak:     'Weak',
  balanced: 'Balanced',
  open:     'Open',
  radiant:  'Radiant',
}

function ChakraBar({ status }: { status: ChakraStatus }) {
  const info = ChakraInfo[status.chakra]
  const width = useSharedValue(0)

  useEffect(() => {
    width.value = withDelay(200, withTiming(status.score, { duration: 800, easing: Easing.out(Easing.cubic) }))
  }, [])

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
    backgroundColor: STATUS_COLORS[status.status],
  }))

  return (
    <View style={chakraStyles.row}>
      <Text style={[chakraStyles.symbol, { color: info.color }]}>{info.symbol}</Text>
      <Text style={chakraStyles.label}>{info.label}</Text>
      <View style={chakraStyles.track}>
        <Animated.View style={[chakraStyles.fill, barStyle]} />
      </View>
      <Text style={[chakraStyles.statusText, { color: STATUS_COLORS[status.status] }]}>
        {STATUS_LABELS[status.status]}
      </Text>
    </View>
  )
}

const chakraStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  symbol: {
    fontSize: 16,
    width: 18,
    textAlign: 'center',
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    width: 84,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.label,
    width: 56,
    textAlign: 'right',
  },
})

// ─── Section wrapper with fade-in ────────────────────────────────────────────

function Section({
  title,
  symbol,
  delay = 0,
  children,
}: {
  title: string
  symbol: string
  delay?: number
  children: React.ReactNode
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={sectionStyles.container}>
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.symbol}>{symbol}</Text>
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      <View style={sectionStyles.body}>{children}</View>
    </Animated.View>
  )
}

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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

// ─── Bullet item ──────────────────────────────────────────────────────────────

function Bullet({ text, color = Colors.aura.violet }: { text: string; color?: string }) {
  return (
    <View style={bulletStyles.row}>
      <Text style={[bulletStyles.dot, { color }]}>◆</Text>
      <Text style={bulletStyles.text}>{text}</Text>
    </View>
  )
}

const bulletStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  dot: {
    fontSize: 9,
    marginTop: 5,
  },
  text: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    lineHeight: 24,
  },
})

// ─── Placeholder reading while Claude responds ─────────────────────────────

function buildPlaceholderReading(profile: AuraProfile): AuraReading {
  const colorInfo = getColorInfo(profile.primaryColor)
  const colorName = colorInfo?.label ?? profile.primaryColor

  return {
    energyField: [
      `Your aura radiates a dominant ${colorName} frequency — the hallmark of ${colorInfo?.trait ?? 'deep inner power'}. This isn't a static color; it's a living field that shifts with your attention, your breath, and the quality of your presence.`,
      `The interplay between your ${colorName} primary and ${getColorInfo(profile.secondaryColor)?.label ?? profile.secondaryColor} secondary creates a field of unusual complexity. Where most people settle into one dominant register, your field spans multiple octaves simultaneously.`,
      `Your energy level signature — ${profile.energyLevel.replace('-', ' ')} — suggests this is a moment of ${profile.energyLevel === 'depleted' ? 'necessary rest and recalibration' : profile.energyLevel === 'building' ? 'gathering momentum before emergence' : profile.energyLevel === 'balanced' ? 'integration and sustainable flow' : 'peak expression and outward giving'}.`,
    ],
    strengths: profile.primaryTraits,
    blocks: [
      `The shadow of ${colorName} energy can manifest as ${profile.primaryColor === 'red' ? 'rigidity or fear-based control' : profile.primaryColor === 'orange' ? 'creative avoidance or emotional flooding' : profile.primaryColor === 'yellow' ? 'control and perfectionism blocking flow' : profile.primaryColor === 'green' ? 'giving beyond capacity, losing self in others' : profile.primaryColor === 'blue' ? 'perfectionism blocking authentic voice' : profile.primaryColor === 'indigo' ? 'analysis paralysis or isolation from the mundane' : 'spiritual bypassing or disconnection from the body'}.`,
      `Your ${profile.energyLevel === 'depleted' || profile.energyLevel === 'building' ? 'lower-than-optimal' : 'high'} energy state may be creating leakage in your field — places where your light disperses before it can cohere into intention.`,
    ],
    chakraInsights: `Your field shows notable activity in the ${Object.entries(ChakraInfo).find(([k]) => k === profile.chakraStatus.sort((a, b) => b.score - a.score)[0]?.chakra)?.[1]?.label ?? ''} center, with a corresponding quietness in the ${Object.entries(ChakraInfo).find(([k]) => k === profile.chakraStatus.sort((a, b) => a.score - b.score)[0]?.chakra)?.[1]?.label ?? ''} region. The gradient across your seven centers tells a story of where you've been investing — and where you've been withholding.`,
    guidance: {
      practices: [
        profile.primaryColor === 'red' ? 'Daily barefoot earthing — 15 minutes minimum' :
        profile.primaryColor === 'orange' ? 'Freeform movement or dance before the day begins' :
        profile.primaryColor === 'yellow' ? 'Solar plexus breathwork: 4 counts in, hold 4, out 4' :
        profile.primaryColor === 'green' ? 'Heart coherence meditation (HeartMath protocol)' :
        profile.primaryColor === 'blue' ? 'Morning pages or voice journaling — speak without editing' :
        profile.primaryColor === 'indigo' ? 'Third eye activation: candlelight gazing before sleep' :
        'Transpersonal meditation: dissolving the boundary of self',
        'Spend time daily in silence — not passive silence, but listening silence',
        profile.energyLevel === 'depleted' ? 'Prioritize 9 hours of sleep for 10 days; your field is restoring' : 'Channel your energy into one primary creative project',
      ],
      colors: [
        `Wear ${getColorInfo(profile.secondaryColor)?.label ?? profile.secondaryColor} to strengthen your secondary field`,
        `Bring ${getColorInfo(profile.tertiaryColor)?.label ?? profile.tertiaryColor} into your home environment`,
        `Avoid wearing black in excess — it can collapse your aura boundary`,
      ],
      crystals: [
        profile.primaryColor === 'red'    ? 'Red Jasper or Garnet — amplifies root stability' :
        profile.primaryColor === 'orange' ? 'Carnelian or Orange Calcite — flows sacral creativity' :
        profile.primaryColor === 'yellow' ? 'Citrine or Yellow Tiger\'s Eye — solar plexus power' :
        profile.primaryColor === 'green'  ? 'Rose Quartz or Green Aventurine — heart coherence' :
        profile.primaryColor === 'blue'   ? 'Blue Lace Agate or Aquamarine — throat clarity' :
        profile.primaryColor === 'indigo' ? 'Lapis Lazuli or Sodalite — third eye activation' :
        'Amethyst or Clear Quartz — crown connection',
        'Black Tourmaline for field protection during depleted states',
      ],
    },
  }
}

// ─── Main result screen ───────────────────────────────────────────────────────

export default function AuraResultScreen() {
  const profile: AuraProfile | null = (global as any).__auraProfile ?? null
  const source: 'questionnaire' | 'camera' = (global as any).__auraSource ?? 'questionnaire'

  const [reading, setReading] = useState<AuraReading | null>(null)
  const [loadingReading, setLoadingReading] = useState(false)

  useEffect(() => {
    if (!profile) return
    // Immediately show placeholder — no wait
    setReading(buildPlaceholderReading(profile))
    // Then try to fetch from Claude via Supabase Edge Function
    fetchClaudeReading(profile)
  }, [])

  const fetchClaudeReading = async (p: AuraProfile) => {
    const oracleUrl = process.env.EXPO_PUBLIC_AURA_ORACLE_URL
    if (!oracleUrl) return // Supabase not configured yet
    setLoadingReading(true)
    try {
      const resp = await fetch(oracleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: p,
          source,
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        if (data.reading) setReading(data.reading)
      }
    } catch (e) {
      // Silently fall back to placeholder reading
    } finally {
      setLoadingReading(false)
    }
  }

  const handleShare = async () => {
    if (!profile) return
    const colorInfo = getColorInfo(profile.primaryColor)
    await Share.share({
      message: `My aura is ${colorInfo?.label ?? profile.primaryColor} — ${colorInfo?.trait ?? ''}.\n\nDiscover yours with the Aura app.`,
      title: 'My Aura Reading',
    })
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.textMuted, ...Typography.body }}>No reading found. Take the questionnaire first.</Text>
        <TouchableOpacity onPress={() => router.replace('/')} style={{ marginTop: Spacing.xl }}>
          <Text style={{ color: Colors.aura.violet, ...Typography.body }}>Go Home</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const primaryInfo   = getColorInfo(profile.primaryColor)
  const secondaryInfo = getColorInfo(profile.secondaryColor)
  const tertiaryInfo  = getColorInfo(profile.tertiaryColor)
  const primaryHex    = primaryInfo ? AuraColors.find(c => c.key === primaryInfo.key)?.hex ?? Colors.aura.violet : Colors.aura.violet

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
      >
        {/* ── Aura visualization header ── */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.vizSection}>
          {/* Background glow */}
          <View
            style={[
              styles.vizGlow,
              { backgroundColor: primaryHex + '18' },
            ]}
          />

          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←  Back</Text>
          </TouchableOpacity>

          {/* The orb */}
          <View style={styles.orbWrapper}>
            <AuraOrb profile={profile} size={ORB_SIZE} animate />
          </View>

          {/* Aura name */}
          <View style={styles.auraNameBlock}>
            <Text style={styles.auraLabel}>YOUR AURA</Text>
            <Text style={[styles.auraName, { color: primaryHex }]}>
              {primaryInfo?.label ?? profile.primaryColor}
            </Text>
            <Text style={styles.auraTheme}>{profile.dominantTheme}</Text>
          </View>

          {/* Energy level badge */}
          <View style={[styles.energyBadge, { borderColor: primaryHex + '55' }]}>
            <Text style={[styles.energyBadgeText, { color: primaryHex }]}>
              {profile.energyLevel.charAt(0).toUpperCase() + profile.energyLevel.slice(1)} Energy Field
            </Text>
          </View>
        </Animated.View>

        {/* ── Reading sections ── */}
        <View style={styles.readingContent}>

          {/* Aura Colors */}
          <Section title="Your Aura Colors" symbol="◉" delay={100}>
            {[
              { role: 'Primary',   info: primaryInfo,   label: 'Dominant frequency' },
              { role: 'Secondary', info: secondaryInfo, label: 'Supporting field' },
              { role: 'Tertiary',  info: tertiaryInfo,  label: 'Subtler layer' },
            ].map(({ role, info, label }) => {
              const hex = AuraColors.find(c => c.key === info?.key)?.hex ?? '#888'
              return (
                <View key={role} style={colorStyles.row}>
                  <View style={[colorStyles.swatch, { backgroundColor: hex }]} />
                  <View style={colorStyles.info}>
                    <Text style={colorStyles.role}>{role}: <Text style={[colorStyles.name, { color: hex }]}>{info?.label}</Text></Text>
                    <Text style={colorStyles.sub}>{label} — {info?.trait}</Text>
                  </View>
                </View>
              )
            })}
          </Section>

          {/* Energy Field */}
          {reading && (
            <Section title="Your Energy Field" symbol="◈" delay={200}>
              {reading.energyField.map((para, i) => (
                <Text key={i} style={readingStyles.paragraph}>{para}</Text>
              ))}
              {loadingReading && <ActivityIndicator size="small" color={Colors.aura.violet} />}
            </Section>
          )}

          {/* Strengths */}
          {reading && (
            <Section title="Strengths in Your Field" symbol="✦" delay={300}>
              {reading.strengths.map((s, i) => (
                <Bullet key={i} text={s} color={primaryHex} />
              ))}
            </Section>
          )}

          {/* Energy Blocks */}
          {reading && (
            <Section title="Energy Blocks" symbol="◇" delay={400}>
              {reading.blocks.map((b, i) => (
                <Bullet key={i} text={b} color={Colors.aura.red} />
              ))}
            </Section>
          )}

          {/* Chakra Status */}
          <Section title="Chakra Status" symbol="▼" delay={500}>
            {profile.chakraStatus.map(cs => (
              <ChakraBar key={cs.chakra} status={cs} />
            ))}
            {reading && (
              <Text style={[readingStyles.paragraph, { marginTop: Spacing.md }]}>
                {reading.chakraInsights}
              </Text>
            )}
          </Section>

          {/* Guidance */}
          {reading && (
            <Section title="Guidance" symbol="✧" delay={600}>
              <Text style={guidanceStyles.subhead}>Practices</Text>
              {reading.guidance.practices.map((p, i) => <Bullet key={i} text={p} color={Colors.gold} />)}

              <Text style={[guidanceStyles.subhead, { marginTop: Spacing.md }]}>Colors to Wear</Text>
              {reading.guidance.colors.map((c, i) => <Bullet key={i} text={c} color={Colors.gold} />)}

              <Text style={[guidanceStyles.subhead, { marginTop: Spacing.md }]}>Crystal Allies</Text>
              {reading.guidance.crystals.map((c, i) => <Bullet key={i} text={c} color={Colors.gold} />)}
            </Section>
          )}

          {/* Share button */}
          <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.shareBlock}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.shareButtonText}>Share My Aura</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.homeLink} onPress={() => router.replace('/')}>
              <Text style={styles.homeLinkText}>← Back to Home</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  vizSection: {
    minHeight: SCREEN_WIDTH * 1.05,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  vizGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    left: Spacing.xl,
  },
  backText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  orbWrapper: {
    marginBottom: Spacing.xl,
  },
  auraNameBlock: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  auraLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    letterSpacing: 3,
  },
  auraName: {
    ...Typography.display,
    fontWeight: '700',
  },
  auraTheme: {
    ...Typography.body,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  energyBadge: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  energyBadgeText: {
    ...Typography.label,
    letterSpacing: 1,
  },
  readingContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  shareBlock: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  shareButton: {
    backgroundColor: Colors.aura.violet,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xxxl,
    shadowColor: Colors.aura.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  shareButtonText: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  homeLink: {
    padding: Spacing.md,
  },
  homeLinkText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
})

const colorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  role: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  name: {
    fontWeight: '700',
  },
  sub: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
})

const readingStyles = StyleSheet.create({
  paragraph: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 26,
  },
})

const guidanceStyles = StyleSheet.create({
  subhead: {
    ...Typography.labelLarge,
    color: Colors.gold,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
})
