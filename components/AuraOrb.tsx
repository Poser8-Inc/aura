import React, { useEffect } from 'react'
import { View } from 'react-native'
import {
  Canvas,
  Circle,
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { Colors } from '@/constants/theme'
import { AuraProfile } from '@/lib/auraGenerator'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuraOrbProps {
  profile: AuraProfile
  size?: number           // outer canvas dimension
  initials?: string       // e.g. "KH" — shown in center
  animate?: boolean       // default true
  intensity?: number      // 0–1, controls glow brightness
}

// ─── Color helpers ────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  red:    '#E53E3E',
  orange: '#DD6B20',
  yellow: '#D69E2E',
  green:  '#38A169',
  blue:   '#3182CE',
  indigo: '#553C9A',
  violet: '#805AD5',
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return hex + a
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuraOrb({
  profile,
  size = 280,
  initials,
  animate = true,
  intensity = 0.85,
}: AuraOrbProps) {
  const primaryHex   = COLOR_MAP[profile.primaryColor]   ?? '#805AD5'
  const secondaryHex = COLOR_MAP[profile.secondaryColor] ?? '#553C9A'
  const tertiaryHex  = COLOR_MAP[profile.tertiaryColor]  ?? '#3182CE'

  // Animation values
  const pulse    = useSharedValue(1)
  const rotation = useSharedValue(0)
  const outerPulse = useSharedValue(1)

  useEffect(() => {
    if (!animate) return

    // Slow inner pulse 0.92 → 1.08 over 3s
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
        withTiming(1.08, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      true,
    )

    // Outer glow breathes slower 0.95 → 1.12 over 4.5s
    outerPulse.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 4500, easing: Easing.inOut(Easing.sine) }),
        withTiming(1.12, { duration: 4500, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      true,
    )

    // Very slow rotation for the middle ring
    rotation.value = withRepeat(
      withTiming(1, { duration: 16000, easing: Easing.linear }),
      -1,
      false,
    )
  }, [animate])

  const cx = size / 2
  const cy = size / 2

  // Radii ratios
  const outerR  = size * 0.48
  const midR    = size * 0.35
  const innerR  = size * 0.22

  // Skia-based static canvas (Reanimated wraps the View for scale/opacity)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerPulse.value }],
    position: 'absolute',
  }))

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>

      {/* Outermost glow layer — most diffuse, tertiary color */}
      <Animated.View style={[outerStyle, { width: size, height: size }]}>
        <Canvas style={{ width: size, height: size }}>
          <Circle cx={cx} cy={cy} r={outerR}>
            <RadialGradient
              c={vec(cx, cy)}
              r={outerR}
              colors={[
                hexWithAlpha(tertiaryHex, intensity * 0.22),
                hexWithAlpha(secondaryHex, intensity * 0.10),
                'transparent',
              ]}
            />
            <BlurMask blur={20} style="normal" />
          </Circle>
        </Canvas>
      </Animated.View>

      {/* Middle ring — secondary color with soft blur */}
      <Animated.View style={[animatedStyle, { position: 'absolute', width: size, height: size }]}>
        <Canvas style={{ width: size, height: size }}>
          <Circle cx={cx} cy={cy} r={midR}>
            <RadialGradient
              c={vec(cx, cy)}
              r={midR}
              colors={[
                hexWithAlpha(primaryHex, intensity * 0.55),
                hexWithAlpha(secondaryHex, intensity * 0.35),
                hexWithAlpha(tertiaryHex, intensity * 0.10),
                'transparent',
              ]}
            />
            <BlurMask blur={10} style="normal" />
          </Circle>
        </Canvas>
      </Animated.View>

      {/* Inner orb — dense, primary color core */}
      <Canvas style={{ width: size, height: size, position: 'absolute' }}>
        {/* Bright core */}
        <Circle cx={cx} cy={cy} r={innerR}>
          <RadialGradient
            c={vec(cx, cy)}
            r={innerR}
            colors={[
              '#FFFFFF' + Math.round(intensity * 0.8 * 255).toString(16).padStart(2, '0'),
              hexWithAlpha(primaryHex, intensity * 0.9),
              hexWithAlpha(primaryHex, intensity * 0.7),
            ]}
          />
        </Circle>

        {/* Soft edge fade on core */}
        <Circle cx={cx} cy={cy} r={innerR + 8} opacity={0.3}>
          <RadialGradient
            c={vec(cx, cy)}
            r={innerR + 8}
            colors={[
              hexWithAlpha(primaryHex, 0.6),
              'transparent',
            ]}
          />
          <BlurMask blur={6} style="normal" />
        </Circle>
      </Canvas>

    </View>
  )
}

// ─── Small variant for History list items ────────────────────────────────────

export function AuraOrbSmall({ profile, size = 56 }: { profile: AuraProfile; size?: number }) {
  return <AuraOrb profile={profile} size={size} animate={false} intensity={0.9} />
}
