import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native'
import * as Location from 'expo-location'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { router } from 'expo-router'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme'
import {
  findPhotographers,
  tierMessage,
  type RankedPhotographer,
  type SearchResult,
} from '@/lib/photographers'

type Phase =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'denied'; canAskAgain: boolean }
  | { kind: 'locating' }
  | { kind: 'searching' }
  | { kind: 'results'; result: SearchResult; userCountry?: string }
  | { kind: 'error'; message: string }

export default function FindPhotographerScreen() {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  const runSearch = useCallback(async () => {
    setPhase({ kind: 'requesting' })

    let permission = await Location.getForegroundPermissionsAsync()
    if (!permission.granted) {
      const req = await Location.requestForegroundPermissionsAsync()
      permission = req
    }
    if (!permission.granted) {
      setPhase({ kind: 'denied', canAskAgain: permission.canAskAgain ?? false })
      return
    }

    setPhase({ kind: 'locating' })

    const LOCATION_TIMEOUT_MS = 30_000
    let coords: { latitude: number; longitude: number }
    try {
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), LOCATION_TIMEOUT_MS),
        ),
      ])
      coords = pos.coords
    } catch (err) {
      const isTimeout = err instanceof Error && err.message === 'LOCATION_TIMEOUT'
      setPhase({
        kind: 'error',
        message: isTimeout
          ? 'Could not get your location in 30 seconds. Try again, move to an area with better GPS, or enter your city manually.'
          : err instanceof Error
            ? err.message
            : 'Could not determine your location.',
      })
      return
    }

    setPhase({ kind: 'searching' })

    let userCountry: string | undefined
    try {
      const geo = await Location.reverseGeocodeAsync(coords)
      userCountry = geo[0]?.country ?? undefined
    } catch {
      // best-effort — country fallback is optional
    }

    const result = findPhotographers(coords.latitude, coords.longitude, userCountry)
    setPhase({ kind: 'results', result, userCountry })
  }, [])

  useEffect(() => {
    runSearch()
  }, [runSearch])

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="link"
          accessibilityLabel="Back"
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Aura Photographers</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {(phase.kind === 'idle' || phase.kind === 'requesting' ||
          phase.kind === 'locating' || phase.kind === 'searching') && (
          <LoadingState phase={phase.kind} />
        )}

        {phase.kind === 'denied' && (
          <DeniedState
            canAskAgain={phase.canAskAgain}
            onRetry={runSearch}
          />
        )}

        {phase.kind === 'error' && (
          <ErrorState message={phase.message} onRetry={runSearch} />
        )}

        {phase.kind === 'results' && (
          <ResultsView result={phase.result} userCountry={phase.userCountry} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingState({ phase }: { phase: 'idle' | 'requesting' | 'locating' | 'searching' }) {
  const message =
    phase === 'requesting'
      ? 'Asking for location permission…'
      : phase === 'locating'
      ? 'Reading your location…'
      : phase === 'searching'
      ? 'Searching the directory…'
      : 'Preparing…'
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
      <ActivityIndicator size="large" color={Colors.aura.violet} />
      <Text style={styles.loadingText}>{message}</Text>
    </Animated.View>
  )
}

function DeniedState({ canAskAgain, onRetry }: { canAskAgain: boolean; onRetry: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
      <Text style={styles.deniedTitle}>Location access denied</Text>
      <Text style={styles.deniedBody}>
        Aura needs your location to find professional aura photographers near you. We
        don't store or share it — the search runs on your device.
      </Text>
      {canAskAgain ? (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            Alert.alert(
              'Open Settings',
              'Please enable location access for Aura in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ],
            )
          }}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Open Settings</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
      <Text style={styles.deniedTitle}>Something went wrong</Text>
      <Text style={styles.deniedBody}>{message}</Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

function ResultsView({
  result,
  userCountry,
}: {
  result: SearchResult
  userCountry?: string
}) {
  if (result.results.length === 0) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
        <Text style={styles.deniedTitle}>No photographers found</Text>
        <Text style={styles.deniedBody}>
          Our worldwide directory doesn't have a verified aura photographer
          {userCountry ? ` in ${userCountry}` : ''} yet. Check back as we expand it,
          or share this app with a practitioner you know.
        </Text>
      </Animated.View>
    )
  }

  return (
    <View>
      <Animated.Text entering={FadeIn.duration(400)} style={styles.tierLabel}>
        {tierMessage(result.tier, result.radiusMi)}
      </Animated.Text>
      {result.results.map((p, i) => (
        <Animated.View key={p.id} entering={FadeInDown.delay(i * 60).duration(400)}>
          <PhotographerCard photographer={p} />
        </Animated.View>
      ))}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Worldwide directory · curated, not exhaustive. Know a practitioner we should add?
        </Text>
      </View>
    </View>
  )
}

function PhotographerCard({ photographer }: { photographer: RankedPhotographer }) {
  const distanceText =
    photographer.distanceMi < 1
      ? '<1 mi'
      : `${Math.round(photographer.distanceMi)} mi`

  const openMaps = () => {
    // Skip falsy fields so we don't end up with "Studio undefined" when address is missing.
    const q = encodeURIComponent([photographer.name, photographer.address].filter(Boolean).join(' '))
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?q=${q}`
        : `https://www.google.com/maps/search/?api=1&query=${q}`
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open maps')
    })
  }

  const openWebsite = () => {
    if (!photographer.website) return
    Linking.openURL(photographer.website).catch(() => {
      Alert.alert('Could not open website')
    })
  }

  const callPhone = () => {
    if (!photographer.phone) return
    const tel = `tel:${photographer.phone.replace(/[^+\d]/g, '')}`
    Linking.openURL(tel).catch(() => {
      Alert.alert('Could not place call')
    })
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardName} numberOfLines={2}>
          {photographer.name}
        </Text>
        <Text style={styles.cardDistance}>{distanceText}</Text>
      </View>
      <Text style={styles.cardLocation}>
        {photographer.city}, {photographer.region}
        {photographer.region ? ' · ' : ''}
        {photographer.country}
      </Text>
      <View style={styles.cardChips}>
        <Chip label={photographer.system} tone="violet" />
        {photographer.mailIn && <Chip label="Mail-in" tone="gold" />}
        {photographer.verified ? (
          <Chip label="Verified" tone="success" />
        ) : (
          <Chip label="Unverified" tone="muted" />
        )}
      </View>
      {photographer.notes && (
        <Text style={styles.cardNotes}>{photographer.notes}</Text>
      )}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={openMaps}
          accessibilityRole="link"
          accessibilityLabel={`Open ${photographer.name} in Maps`}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>Maps</Text>
        </TouchableOpacity>
        {photographer.website && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openWebsite}
            accessibilityRole="link"
            accessibilityLabel={`Open ${photographer.name} website`}
            activeOpacity={0.8}
          >
            <Text style={styles.actionText}>Website</Text>
          </TouchableOpacity>
        )}
        {photographer.phone && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={callPhone}
            accessibilityRole="link"
            accessibilityLabel={`Call ${photographer.name}`}
            activeOpacity={0.8}
          >
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

function Chip({ label, tone }: { label: string; tone: 'violet' | 'gold' | 'success' | 'muted' }) {
  const palette =
    tone === 'violet'
      ? { bg: 'rgba(128,90,213,0.18)', fg: Colors.aura.violet, border: 'rgba(128,90,213,0.4)' }
      : tone === 'gold'
      ? { bg: 'rgba(201,168,76,0.18)', fg: Colors.gold, border: 'rgba(201,168,76,0.4)' }
      : tone === 'success'
      ? { bg: 'rgba(39,174,96,0.18)', fg: Colors.success, border: 'rgba(39,174,96,0.4)' }
      : { bg: Colors.surface, fg: Colors.textMuted, border: Colors.border }
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.chipText, { color: palette.fg }]}>{label}</Text>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.md,
  },
  backBtnText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  title: {
    flex: 1,
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  deniedTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
  },
  deniedBody: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.aura.violet,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.md,
  },
  primaryButtonText: {
    ...Typography.h3,
    color: Colors.text,
  },

  tierLabel: {
    ...Typography.label,
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  cardName: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
  },
  cardDistance: {
    ...Typography.label,
    color: Colors.gold,
    letterSpacing: 0.6,
  },
  cardLocation: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    ...Typography.label,
    fontSize: 11,
  },
  cardNotes: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },

  footer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
