// app/index.web.tsx — web override of the Aura home screen.
//
// The native index.tsx imports @shopify/react-native-skia and AuraOrb, both
// of which break web bundling (skia at module-load time). The web version is
// a discovery landing: hero, value prop, store CTAs.

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Platform } from 'react-native'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme'

const APP_STORE_URL = 'https://apps.apple.com/app/id6767143508'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.templari.aura'

const FEATURES = [
  { glyph: '◉', label: 'See your aura — chakra spectrum, dominant colors, layer harmonics' },
  { glyph: '✻', label: 'Photo aura reading from a single picture' },
  { glyph: '✶', label: 'Questionnaire-based daily energy snapshots' },
  { glyph: '◈', label: 'Personality field synthesis across 7 chakras' },
  { glyph: '★', label: 'History of every reading you save' },
]

export default function HomeWeb() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>The Templari Suite</Text>
          <Text style={styles.heroTitle}>AURA</Text>
          <Text style={styles.heroSubtitle}>
            See the energy field around you — colors, chakras, and personality patterns rendered from your aura.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureGlyph}>{f.glyph}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.continueHeader}>
          Continue in the app to capture your aura
        </Text>
        <View style={styles.storeBtnRow}>
          <TouchableOpacity
            style={styles.storeBtn}
            onPress={() => { Linking.openURL(APP_STORE_URL).catch(() => {}) }}
            accessibilityRole="link"
            accessibilityLabel="Open in App Store"
            activeOpacity={0.85}
          >
            <View style={styles.btnCol}>
              <Text style={styles.btnSmall}>Download on the</Text>
              <Text style={styles.btnLarge}>App Store</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.storeBtn}
            onPress={() => { Linking.openURL(PLAY_STORE_URL).catch(() => {}) }}
            accessibilityRole="link"
            accessibilityLabel="Get it on Google Play"
            activeOpacity={0.85}
          >
            <View style={styles.btnCol}>
              <Text style={styles.btnSmall}>Get it on</Text>
              <Text style={styles.btnLarge}>Google Play</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.xl, gap: Spacing.lg, alignItems: 'center' },
  hero: { alignItems: 'center', gap: Spacing.md, maxWidth: 560 },
  heroEyebrow: { ...Typography.label, color: Colors.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 48, fontWeight: '700', color: Colors.gold, letterSpacing: 4 },
  heroSubtitle: { ...Typography.body, color: Colors.text, textAlign: 'center', lineHeight: 26 },
  features: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, maxWidth: 560, width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureGlyph: { fontSize: 18, color: Colors.gold, width: 28, textAlign: 'center' },
  featureLabel: { ...Typography.body, color: Colors.text, flex: 1 },
  continueHeader: { ...Typography.h3, color: Colors.gold, textAlign: 'center', letterSpacing: 0.4 },
  storeBtnRow: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center', maxWidth: 480, width: '100%' },
  storeBtn: { backgroundColor: Colors.black, borderRadius: BorderRadius.lg, paddingVertical: 12, paddingHorizontal: Spacing.lg, flex: 1, maxWidth: 220, borderWidth: 1, borderColor: Colors.border },
  btnCol: { alignItems: 'center' },
  btnSmall: { ...Typography.label, color: Colors.white, fontSize: 10, letterSpacing: 0.5, opacity: 0.85 },
  btnLarge: { ...Typography.h3, color: Colors.white, fontWeight: '700', fontSize: 16 },
})
