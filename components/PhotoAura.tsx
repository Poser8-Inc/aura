import React from 'react'
import { View, Image, StyleSheet } from 'react-native'
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
  Easing,
} from 'react-native-reanimated'
import { AuraProfile } from '@/lib/auraGenerator'

const COLOR_MAP: Record<string, string> = {
  red:    '#E53E3E',
  orange: '#DD6B20',
  yellow: '#D69E2E',
  green:  '#38A169',
  blue:   '#3182CE',
  indigo: '#553C9A',
  violet: '#805AD5',
}

interface PhotoAuraProps {
  photoBase64: string
  profile: AuraProfile
  size?: number
  animate?: boolean
}

// Photo-centered aura: user's selfie in a circular crop, surrounded by a soft
// glow whose colors are drawn from their primary/secondary chakra colors. The
// glow sits behind the photo, extending past the photo edge — so the photo
// appears bathed in chakra light.
export function PhotoAura({
  photoBase64,
  profile,
  size = 240,
  animate = true,
}: PhotoAuraProps) {
  const center = size / 2
  const photoFrac = 0.62          // photo occupies ~62% of canvas; rest is halo
  const photoSize = size * photoFrac
  const photoOffset = (size - photoSize) / 2

  const primary   = COLOR_MAP[profile.primaryColor]   ?? '#805AD5'
  const secondary = COLOR_MAP[profile.secondaryColor] ?? '#553C9A'
  const tertiary  = COLOR_MAP[profile.tertiaryColor]  ?? '#3182CE'

  // Subtle breathing animation on the halo
  const breathScale = useSharedValue(1)
  React.useEffect(() => {
    if (!animate) return
    breathScale.value = withRepeat(
      withTiming(1.04, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
  }, [animate])

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }))

  return (
    <View style={{ width: size, height: size }}>
      {/* Outer halo — Skia radial gradient + blur */}
      <Animated.View style={[StyleSheet.absoluteFill, haloStyle]}>
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Outermost diffused glow */}
          <Circle cx={center} cy={center} r={size / 2}>
            <RadialGradient
              c={vec(center, center)}
              r={size / 2}
              colors={[`${primary}00`, `${primary}40`, `${secondary}20`, '#00000000']}
              positions={[0.55, 0.78, 0.92, 1.0]}
            />
            <BlurMask blur={26} style="solid" />
          </Circle>
          {/* Brighter rim around the photo */}
          <Circle cx={center} cy={center} r={photoSize / 2 + 8}>
            <RadialGradient
              c={vec(center, center)}
              r={photoSize / 2 + 8}
              colors={[`${primary}00`, `${primary}AA`, `${tertiary}88`]}
              positions={[0.86, 0.95, 1.0]}
            />
            <BlurMask blur={10} style="solid" />
          </Circle>
        </Canvas>
      </Animated.View>

      {/* Photo, circular cropped, on top of halo */}
      <View
        style={[
          styles.photoFrame,
          {
            top: photoOffset,
            left: photoOffset,
            width: photoSize,
            height: photoSize,
            borderRadius: photoSize / 2,
            shadowColor: primary,
          },
        ]}
      >
        <Image
          source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
          style={{
            width: photoSize,
            height: photoSize,
            borderRadius: photoSize / 2,
          }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  photoFrame: {
    position: 'absolute',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
})
