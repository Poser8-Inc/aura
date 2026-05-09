import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuraOrbSmall } from '@/components/AuraOrb'
import { Colors, Typography, Spacing, BorderRadius, AuraColors } from '@/constants/theme'
import { AuraProfile } from '@/lib/auraGenerator'
import { setActiveReading } from '@/lib/store'
import { loadSyntheses, type AuraSynthesis } from '@/lib/synthesis'
import { BottomNav } from './index'

// ─── Stored reading record ────────────────────────────────────────────────────

interface AuraRecord {
  id: string
  profile: AuraProfile
  source: 'questionnaire' | 'camera'
  createdAt: string // ISO string
  thumbBase64?: string // 200x200 JPEG, ~30 KB; only present for camera readings
}

const STORAGE_KEY = 'aura_readings_v1'

export async function saveReading(
  profile: AuraProfile,
  source: 'questionnaire' | 'camera',
  thumbBase64?: string,
) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    const existing: AuraRecord[] = stored ? JSON.parse(stored) : []
    const record: AuraRecord = {
      id: Date.now().toString(),
      profile,
      source,
      createdAt: new Date().toISOString(),
      thumbBase64,
    }
    const updated = [record, ...existing].slice(0, 50) // keep last 50
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    // Silent fail — not blocking
  }
}

// ─── Timeline item ────────────────────────────────────────────────────────────

function HistoryItem({ record, index }: { record: AuraRecord; index: number }) {
  const primaryHex = AuraColors.find(c => c.key === record.profile.primaryColor)?.hex ?? Colors.aura.violet
  const primaryLabel = AuraColors.find(c => c.key === record.profile.primaryColor)?.label ?? record.profile.primaryColor

  const date = new Date(record.createdAt)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const handlePress = async () => {
    await setActiveReading({ profile: record.profile, source: record.source })
    router.push('/aura-result')
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <TouchableOpacity
        style={itemStyles.container}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${primaryLabel} aura reading from ${formattedDate}`}
        activeOpacity={0.85}
      >
        {/* Timeline line + orb */}
        <View style={itemStyles.timeline}>
          <View style={[itemStyles.timelineDot, { backgroundColor: primaryHex }]} />
          {index < 99 && <View style={itemStyles.timelineLine} />}
        </View>

        {/* Content */}
        <View style={itemStyles.content}>
          <View style={itemStyles.row}>
            {record.thumbBase64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${record.thumbBase64}` }}
                style={itemStyles.thumb}
              />
            ) : (
              <AuraOrbSmall profile={record.profile} size={52} />
            )}
            <View style={itemStyles.info}>
              <View style={itemStyles.infoTop}>
                <Text style={[itemStyles.colorName, { color: primaryHex }]}>{primaryLabel} Aura</Text>
                <View style={itemStyles.sourceBadge}>
                  <Text style={itemStyles.sourceText}>
                    {record.source === 'camera' ? '◈ Camera' : '◉ Reading'}
                  </Text>
                </View>
              </View>
              <Text style={itemStyles.theme}>{record.profile.dominantTheme}</Text>
              <Text style={itemStyles.date}>{formattedDate} · {formattedTime}</Text>
            </View>
          </View>

          {/* Mini chakra indicators */}
          <View style={itemStyles.chakraRow}>
            {record.profile.chakraStatus.map(cs => {
              const hex = AuraColors.find(c => {
                const map: Record<string, string> = {
                  root: 'red', sacral: 'orange', solarPlexus: 'yellow',
                  heart: 'green', throat: 'blue', thirdEye: 'indigo', crown: 'violet',
                }
                return c.key === map[cs.chakra]
              })?.hex ?? '#555'
              const opacity = cs.status === 'blocked' ? 0.2 :
                cs.status === 'weak' ? 0.4 :
                cs.status === 'balanced' ? 0.65 :
                cs.status === 'open' ? 0.85 : 1
              return (
                <View
                  key={cs.chakra}
                  style={[itemStyles.chakraDot, { backgroundColor: hex, opacity }]}
                />
              )
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingRight: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.bg,
  },
  timeline: {
    width: 40,
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  colorName: {
    ...Typography.body,
    fontWeight: '700',
  },
  sourceBadge: {
    backgroundColor: Colors.surfaceRaised,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  sourceText: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  theme: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  date: {
    ...Typography.label,
    color: Colors.textMuted + 'AA',
  },
  chakraRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chakraDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
})

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyHistory() {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.symbol}>◈</Text>
      <Text style={emptyStyles.title}>No readings yet</Text>
      <Text style={emptyStyles.sub}>
        Take your first aura reading to see your energy history here.
      </Text>
      <TouchableOpacity
        style={emptyStyles.button}
        onPress={() => router.push('/questionnaire')}
        accessibilityRole="link"
        accessibilityLabel="Take a reading"
        activeOpacity={0.85}
      >
        <Text style={emptyStyles.buttonText}>Take a Reading</Text>
      </TouchableOpacity>
    </View>
  )
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.lg,
  },
  symbol: {
    fontSize: 48,
    color: Colors.textMuted,
  },
  title: {
    ...Typography.h2,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  sub: {
    ...Typography.body,
    color: Colors.textMuted + 'AA',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    marginTop: Spacing.md,
    backgroundColor: Colors.aura.violet,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xxxl,
  },
  buttonText: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
})

// ─── History Screen ───────────────────────────────────────────────────────────

// Unified history-list item: a reading record OR a synthesis artifact.
// Both are sorted into one chronological list so the synthesis appears
// near the two readings it ties together.
type FeedItem =
  | { kind: 'reading'; record: AuraRecord }
  | { kind: 'synthesis'; synth: AuraSynthesis }

export default function HistoryScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY).then((s) => (s ? (JSON.parse(s) as AuraRecord[]) : [])).catch(() => [] as AuraRecord[]),
      loadSyntheses().catch(() => [] as AuraSynthesis[]),
    ])
      .then(([records, syntheses]) => {
        const items: FeedItem[] = [
          ...records.map<FeedItem>((r) => ({ kind: 'reading', record: r })),
          ...syntheses.map<FeedItem>((s) => ({ kind: 'synthesis', synth: s })),
        ]
        items.sort((a, b) => {
          const ta = a.kind === 'reading' ? a.record.createdAt : a.synth.createdAt
          const tb = b.kind === 'reading' ? b.record.createdAt : b.synth.createdAt
          return tb.localeCompare(ta)
        })
        setFeed(items)
      })
      .finally(() => setLoaded(true))
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Aura History</Text>
        <Text style={styles.subtitle}>Your energy field over time</Text>
      </View>

      {/* List or empty */}
      {loaded && feed.length === 0 ? (
        <EmptyHistory />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => (item.kind === 'reading' ? item.record.id : item.synth.id)}
          renderItem={({ item, index }) =>
            item.kind === 'reading' ? (
              <HistoryItem record={item.record} index={index} />
            ) : (
              <SynthesisCard synth={item.synth} index={index} />
            )
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNav active="history" />
    </SafeAreaView>
  )
}

// ─── Synthesis card ───────────────────────────────────────────────────────────
function SynthesisCard({ synth, index }: { synth: AuraSynthesis; index: number }) {
  const isShock = synth.mode === 'shock'
  const accent = isShock ? '#FFB87A' : '#7FA7D9'
  const date = new Date(synth.createdAt)
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)} style={synthStyles.wrapper}>
      <View style={[synthStyles.card, { borderColor: accent + '60' }]}>
        <View style={synthStyles.headerRow}>
          <Text style={[synthStyles.glyph, { color: accent }]}>{isShock ? '⚡' : '↗'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[synthStyles.modeLabel, { color: accent }]}>
              {isShock ? 'Sudden shift' : 'Drift'}
            </Text>
            <Text style={synthStyles.dateText}>{formatted} · synthesis of two readings</Text>
          </View>
        </View>
        <Text style={synthStyles.narrative}>{synth.narrative}</Text>
      </View>
    </Animated.View>
  )
}

const synthStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  glyph: {
    fontSize: 28,
  },
  modeLabel: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  narrative: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? Spacing.xl + Spacing.md : Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  list: {
    paddingTop: Spacing.xl,
    paddingLeft: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
})
