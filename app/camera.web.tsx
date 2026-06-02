// app/camera.web.tsx — web stub. expo-camera is native-only.

import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme'

const APP_STORE_URL = 'https://apps.apple.com/app/id6767143508'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.templari.aura'

export default function CameraWeb() {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Capture in the app</Text>
        <Text style={styles.body}>
          Aura photo readings use the camera on a phone or tablet. Open AURA from
          the App Store or Google Play to take a reading.
        </Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.storeBtn} onPress={() => Linking.openURL(APP_STORE_URL).catch(() => {})}>
            <View style={styles.col}><Text style={styles.small}>Download on the</Text><Text style={styles.large}>App Store</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.storeBtn} onPress={() => Linking.openURL(PLAY_STORE_URL).catch(() => {})}>
            <View style={styles.col}><Text style={styles.small}>Get it on</Text><Text style={styles.large}>Google Play</Text></View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, maxWidth: 520, width: '100%', borderWidth: 1, borderColor: Colors.border, gap: Spacing.lg },
  title: { ...Typography.h2, color: Colors.gold, textAlign: 'center' },
  body: { ...Typography.body, color: Colors.text, textAlign: 'center', lineHeight: 24 },
  row: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
  storeBtn: { backgroundColor: Colors.black, borderRadius: BorderRadius.lg, paddingVertical: 12, paddingHorizontal: Spacing.lg, flex: 1, maxWidth: 200, borderWidth: 1, borderColor: Colors.border },
  col: { alignItems: 'center' },
  small: { ...Typography.label, color: Colors.white, fontSize: 10, letterSpacing: 0.5, opacity: 0.85 },
  large: { ...Typography.h3, color: Colors.white, fontWeight: '700', fontSize: 16 },
  back: { alignItems: 'center', paddingTop: Spacing.sm },
  backText: { ...Typography.bodySmall, color: Colors.textMuted },
})
