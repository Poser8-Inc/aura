import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated'
import { Canvas, Circle, RadialGradient, vec, BlurMask } from '@shopify/react-native-skia'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const ORB_SIZE = Math.min(SCREEN_WIDTH * 0.72, 300)

// ─── Home Aura Orb (standalone — no profile yet, cosmically generic) ─────────

function HomeAuraOrb() {
  const pulse1 = useSharedValue(1)
  const pulse2 = useSharedValue(1)
  const pulse3 = useSharedValue(1)

  useEffect(() => {
    pulse1.value = withRepeat(
      withSequence(
        withTiming(0.90, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.10, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    )
    pulse2.value = withDelay(1000, withRepeat(
      withSequence(
        withTiming(0.93, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.07, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    ))
    pulse3.value = withDelay(2000, withRepeat(
      withSequence(
        withTiming(0.96, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.14, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    ))
  }, [])

  const cx = ORB_SIZE / 2
  const cy = ORB_SIZE / 2

  const style1 = useAnimatedStyle(() => ({ transform: [{ scale: pulse1.value }] }))
  const style2 = useAnimatedStyle(() => ({ transform: [{ scale: pulse2.value }] }))
  const style3 = useAnimatedStyle(() => ({ transform: [{ scale: pulse3.value }] }))

  return (
    <View style={{ width: ORB_SIZE, height: ORB_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outermost — violet */}
      <Animated.View style={[style3, StyleSheet.absoluteFill]}>
        <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE }}>
          <Circle cx={cx} cy={cy} r={ORB_SIZE * 0.48}>
            <RadialGradient
              c={vec(cx, cy)}
              r={ORB_SIZE * 0.48}
              colors={['rgba(128, 90, 213, 0.18)', 'rgba(85, 60, 154, 0.08)', 'transparent']}
            />
            <BlurMask blur={24} style="normal" />
          </Circle>
        </Canvas>
      </Animated.View>

      {/* Middle — indigo/violet blend */}
      <Animated.View style={[style2, StyleSheet.absoluteFill]}>
        <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE }}>
          <Circle cx={cx} cy={cy} r={ORB_SIZE * 0.36}>
            <RadialGradient
              c={vec(cx, cy)}
              r={ORB_SIZE * 0.36}
              colors={[
                'rgba(128, 90, 213, 0.45)',
                'rgba(85, 60, 154, 0.30)',
                'rgba(49, 130, 206, 0.12)',
                'transparent',
              ]}
            />
            <BlurMask blur={12} style="normal" />
          </Circle>
        </Canvas>
      </Animated.View>

      {/* Inner core — white/violet */}
      <Animated.View style={[style1, StyleSheet.absoluteFill]}>
        <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE }}>
          <Circle cx={cx} cy={cy} r={ORB_SIZE * 0.20}>
            <RadialGradient
              c={vec(cx, cy)}
              r={ORB_SIZE * 0.20}
              colors={[
                'rgba(255, 255, 255, 0.95)',
                'rgba(201, 168, 76, 0.60)',
                'rgba(128, 90, 213, 0.80)',
              ]}
            />
          </Circle>
        </Canvas>
      </Animated.View>
    </View>
  )
}

// ─── Bottom nav bar ───────────────────────────────────────────────────────────

function BottomNav({ active }: { active: 'home' | 'history' | 'learn' }) {
  const tabs = [
    { key: 'home',    label: 'Home',    symbol: '◉', route: '/' as const },
    { key: 'history', label: 'History', symbol: '◈', route: '/history' as const },
    { key: 'learn',   label: 'Learn',   symbol: '✦', route: '/learn' as const },
  ]
  return (
    <View style={styles.navBar}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={styles.navItem}
          onPress={() => tab.key !== active && router.push(tab.route)}
          activeOpacity={0.7}
        >
          <Text style={[styles.navSymbol, tab.key === active && styles.navSymbolActive]}>
            {tab.symbol}
          </Text>
          <Text style={[styles.navLabel, tab.key === active && styles.navLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Ambient background glow */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx={SCREEN_WIDTH / 2} cy={SCREEN_HEIGHT * 0.35} r={SCREEN_WIDTH * 0.6}>
          <RadialGradient
            c={vec(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.35)}
            r={SCREEN_WIDTH * 0.6}
            colors={['rgba(128, 90, 213, 0.08)', 'transparent']}
          />
        </Circle>
      </Canvas>

      <View style={styles.content}>
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100).duration(800)} style={styles.header}>
          <Text style={styles.appName}>AURA</Text>
          <View style={styles.divider} />
        </Animated.View>

        {/* Central orb */}
        <Animated.View entering={FadeIn.delay(300).duration(1000)} style={styles.orbContainer}>
          <HomeAuraOrb />
        </Animated.View>

        {/* Headline */}
        <Animated.View entering={FadeInDown.delay(500).duration(700)} style={styles.headlineBlock}>
          <Text style={styles.headline}>See Your Aura</Text>
          <Text style={styles.subhead}>
            Discover the energy field{'\n'}that surrounds you
          </Text>
        </Animated.View>

        {/* CTAs */}
        <Animated.View entering={FadeInDown.delay(700).duration(700)} style={styles.ctaBlock}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/questionnaire')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Take the Reading</Text>
            <Text style={styles.primaryButtonSub}>Free  •  3 per month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/camera')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Aura Camera</Text>
            <Text style={styles.secondaryButtonSub}>Premium  •  Selfie analysis</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <BottomNav active="home" />
    </View>
  )
}

export { BottomNav }

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  appName: {
    ...Typography.label,
    color: Colors.gold,
    letterSpacing: 6,
    fontSize: 13,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.gold + '55',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headline: {
    ...Typography.display,
    color: Colors.text,
    textAlign: 'center',
  },
  subhead: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
  },
  ctaBlock: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.aura.violet,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: 4,
    shadowColor: Colors.aura.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryButtonText: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  primaryButtonSub: {
    ...Typography.label,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gold + '66',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  secondaryButtonText: {
    ...Typography.h3,
    color: Colors.gold,
  },
  secondaryButtonSub: {
    ...Typography.label,
    color: Colors.gold + '99',
    letterSpacing: 0.8,
  },
  navBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navSymbol: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  navSymbolActive: {
    color: Colors.aura.violet,
  },
  navLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  navLabelActive: {
    color: Colors.aura.violet,
  },
})
