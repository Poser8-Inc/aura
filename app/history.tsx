import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
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
import { BottomNav } from './index'

// ─── Stored reading record ────────────────────────────────────────────────────

interface AuraRecord {
  id: string
  profile: AuraProfile
  source: 'questionnaire' | 'camera'
  createdAt: string // ISO string
}

const STORAGE_KEY = 'aura_readings_v1'

export async function saveReading(profile: AuraProfile, source: 'questionnaire' | 'camera') {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    const existing: AuraRecord[] = stored ? JSON.parse(stored) : []
    const record: AuraRecord = {
      id: Date.now().toString(),
      profile,
      source,
      createdAt: new Date().toISOString(),
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

  const handlePress = () => {
    ;(global as any).__auraProfile = record.profile
    ;(global as any).__auraSource = record.source
    router.push('/aura-result')
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <TouchableOpacity style={itemStyles.container} onPress={handlePress} activeOpacity={0.85}>
        {/* Timeline line + orb */}
        <View style={itemStyles.timeline}>
          <View style={[itemStyles.timelineDot, { backgroundColor: primaryHex }]} />
          {index < 99 && <View style={itemStyles.timelineLine} />}
        </View>

        {/* Content */}
        <View style={itemStyles.content}>
          <View style={itemStyles.row}>
            <AuraOrbSmall profile={record.profile} size={52} />
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

export default function HistoryScreen() {
  const [records, setRecords] = useState<AuraRecord[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored) setRecords(JSON.parse(stored))
      })
      .catch(() => {})
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
      {loaded && records.length === 0 ? (
        <EmptyHistory />
      ) : (
        <FlatList
          data={records}
          keyExtractor={r => r.id}
          renderItem={({ item, index }) => <HistoryItem record={item} index={index} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNav active="history" />
    </SafeAreaView>
  )
}

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
