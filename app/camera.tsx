import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import * as ImageManipulator from 'expo-image-manipulator'
import { router } from 'expo-router'
import Purchases from 'react-native-purchases'
import { useStore, setActiveReading } from '@/lib/store'
import { log } from '@/lib/log'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const CROP_SIZE = Math.min(SCREEN_WIDTH * 0.78, 300)
const CROP_OFFSET_Y = SCREEN_HEIGHT * 0.32

// ─── Animated crop guide ring ─────────────────────────────────────────────────

function CropRing({ size }: { size: number }) {
  const glow = useSharedValue(0.4)

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    )
  }, [])

  const ringStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }))

  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        top: CROP_OFFSET_Y - size / 2,
        alignSelf: 'center',
        pointerEvents: 'none',
      }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: Colors.aura.violet,
          },
          ringStyle,
        ]}
      />
      {/* Corner ticks */}
      {[0, 90, 180, 270].map(angle => (
        <View
          key={angle}
          style={{
            position: 'absolute',
            width: 20,
            height: 20,
            borderColor: Colors.gold,
            borderTopWidth: angle === 0 || angle === 90 ? 2 : 0,
            borderRightWidth: angle === 90 || angle === 180 ? 2 : 0,
            borderBottomWidth: angle === 180 || angle === 270 ? 2 : 0,
            borderLeftWidth: angle === 270 || angle === 0 ? 2 : 0,
            top:
              angle === 0 || angle === 90
                ? -1
                : size - 19,
            left:
              angle === 0 || angle === 270
                ? -1
                : size - 19,
          }}
        />
      ))}
    </View>
  )
}

// ─── Preview overlay ──────────────────────────────────────────────────────────

function PhotoPreview({
  uri,
  onRetake,
  onAnalyze,
  analyzing,
}: {
  uri: string
  onRetake: () => void
  onAnalyze: () => void
  analyzing: boolean
}) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={StyleSheet.absoluteFill}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Dark overlay */}
      <View style={previewStyles.overlay} />

      {/* Circular crop mask */}
      <View style={previewStyles.cropMaskWrapper}>
        <View style={[previewStyles.cropCircle, { width: CROP_SIZE, height: CROP_SIZE }]}>
          <Image source={{ uri }} style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius: CROP_SIZE / 2 }} resizeMode="cover" />
        </View>
      </View>

      {/* Status text */}
      <View style={previewStyles.statusBlock}>
        <Text style={previewStyles.statusTitle}>
          {analyzing ? 'Reading your energy field...' : 'Looking good'}
        </Text>
        <Text style={previewStyles.statusSub}>
          {analyzing
            ? 'Claude Vision is analyzing your aura'
            : 'Claude Vision will analyze your energy from this photo'}
        </Text>
      </View>

      {/* Buttons */}
      {!analyzing && (
        <View style={previewStyles.buttonRow}>
          <TouchableOpacity
            style={previewStyles.retakeButton}
            onPress={onRetake}
            accessibilityRole="button"
            accessibilityLabel="Retake photo"
          >
            <Text style={previewStyles.retakeText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={previewStyles.analyzeButton}
            onPress={onAnalyze}
            accessibilityRole="button"
            accessibilityLabel="Read my aura"
            activeOpacity={0.85}
          >
            <Text style={previewStyles.analyzeText}>Read My Aura</Text>
          </TouchableOpacity>
        </View>
      )}

      {analyzing && (
        <View style={previewStyles.loadingBlock}>
          <ActivityIndicator size="large" color={Colors.aura.violet} />
          <Text style={previewStyles.loadingText}>Analyzing...</Text>
        </View>
      )}
    </Animated.View>
  )
}

const previewStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 8, 15, 0.72)',
  },
  cropMaskWrapper: {
    position: 'absolute',
    top: CROP_OFFSET_Y - CROP_SIZE / 2,
    left: (SCREEN_WIDTH - CROP_SIZE) / 2,
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: CROP_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.aura.violet,
  },
  cropCircle: {
    overflow: 'hidden',
  },
  statusBlock: {
    position: 'absolute',
    top: CROP_OFFSET_Y + CROP_SIZE / 2 + Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
  },
  statusSub: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonRow: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  retakeButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  retakeText: {
    ...Typography.h3,
    color: Colors.textMuted,
  },
  analyzeButton: {
    flex: 2,
    backgroundColor: Colors.aura.violet,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    shadowColor: Colors.aura.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  analyzeText: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  loadingBlock: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.aura.violet,
  },
})

// ─── Main Camera Screen ───────────────────────────────────────────────────────

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [capturedUri, setCapturedUri] = useState<string | null>(null)
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const readingsUsed = useStore((s) => s.readingsUsed)
  const incrementReadings = useStore((s) => s.incrementReadings)

  const handleCapture = async () => {
    if (!cameraRef.current) return
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 })
      if (!photo) return

      // Resize to 512px to keep payload small for vision
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      )
      setCapturedUri(manipulated.uri)
      setCapturedBase64(manipulated.base64 ?? null)
    } catch (e) {
      Alert.alert('Camera Error', 'Could not capture photo. Please try again.')
    }
  }

  const handleAnalyze = async () => {
    // Check entitlement before analysis
    let isPremium = false
    try {
      const customerInfo = await Purchases.getCustomerInfo()
      isPremium = !!customerInfo.entitlements.active['premium']
    } catch (err) {
      log.warn('[rc][aura][camera] getCustomerInfo failed:', err)
      // isPremium stays false (defensive). Don't reroute to paywall on transient RC errors —
      // free-tier counter-based gate below already enforces correct UX.
    }

    if (!isPremium && readingsUsed >= 2) {
      router.push('/paywall')
      return
    }
    incrementReadings()

    const oracleUrl = process.env.EXPO_PUBLIC_AURA_ORACLE_URL
    if (!oracleUrl) {
      log.error(
        '[aura/camera] EXPO_PUBLIC_AURA_ORACLE_URL is not set — aura camera disabled'
      )
      Alert.alert(
        'AI service unavailable',
        'The aura oracle is not configured for this build. Please update the app or contact support.',
      )
      return
    }

    setAnalyzing(true)
    try {
      const base64 = capturedBase64 ?? ''
      const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      if (!ANON_KEY) {
        throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set')
      }
      const resp = await fetch(oracleUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64: base64, source: 'camera' }),
      })
      const data = await resp.json()
      if (data.profile) {
        await setActiveReading({ profile: data.profile, source: 'camera' })
        router.push('/aura-result')
      } else {
        throw new Error('No profile returned')
      }
    } catch (e) {
      Alert.alert('Reading Failed', 'Could not connect to the aura oracle. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  if (!permission) {
    return (
      <View style={camStyles.container}>
        <ActivityIndicator color={Colors.aura.violet} />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={camStyles.container}>
        <View style={camStyles.permBlock}>
          <Text style={camStyles.permTitle}>Camera Access Required</Text>
          <Text style={camStyles.permSub}>
            The Aura Camera needs access to your front camera to read your energy field.
          </Text>
          <TouchableOpacity
            style={camStyles.permButton}
            onPress={requestPermission}
            accessibilityRole="button"
            accessibilityLabel="Allow camera access"
          >
            <Text style={camStyles.permButtonText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={camStyles.backLink}
            onPress={() => router.back()}
            accessibilityRole="link"
            accessibilityLabel="Go back"
          >
            <Text style={camStyles.backLinkText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={camStyles.container}>
      {/* Live camera feed */}
      {!capturedUri && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
        >
          {/* Dark vignette overlay */}
          <View style={camStyles.vignette} />

          {/* Crop guide ring */}
          <CropRing size={CROP_SIZE} />

          {/* Top instruction */}
          <View style={camStyles.topHint}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={camStyles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close camera"
            >
              <Text style={camStyles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={camStyles.hintTitle}>Aura Camera</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Tip */}
          <View style={camStyles.tipBlock}>
            <Text style={camStyles.tipIcon}>◉</Text>
            <Text style={camStyles.tipText}>Good lighting = better reading</Text>
          </View>

          {/* Face positioning hint */}
          <View style={camStyles.positionHint}>
            <Text style={camStyles.positionText}>Center your face in the circle</Text>
          </View>

          {/* Shutter */}
          <View style={camStyles.shutterRow}>
            <TouchableOpacity
              style={camStyles.shutter}
              onPress={handleCapture}
              accessibilityRole="button"
              accessibilityLabel="Capture photo"
              activeOpacity={0.85}
            >
              <View style={camStyles.shutterInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}

      {/* Preview overlay */}
      {capturedUri && (
        <PhotoPreview
          uri={capturedUri}
          onRetake={() => setCapturedUri(null)}
          onAnalyze={handleAnalyze}
          analyzing={analyzing}
        />
      )}
    </View>
  )
}

const camStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 8, 15, 0.35)',
  },
  topHint: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: Colors.text,
  },
  hintTitle: {
    ...Typography.labelLarge,
    color: Colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tipBlock: {
    position: 'absolute',
    top: CROP_OFFSET_Y - CROP_SIZE / 2 - 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  tipIcon: {
    fontSize: 14,
    color: Colors.gold,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.gold,
    fontStyle: 'italic',
  },
  positionHint: {
    position: 'absolute',
    top: CROP_OFFSET_Y + CROP_SIZE / 2 + Spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  positionText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  shutterRow: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.text,
  },
  permBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  permTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
  },
  permSub: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  permButton: {
    backgroundColor: Colors.aura.violet,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xxxl,
    shadowColor: Colors.aura.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  permButtonText: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  backLink: { padding: Spacing.md },
  backLinkText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
})
