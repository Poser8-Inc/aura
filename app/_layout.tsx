import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform, View } from 'react-native'
import * as NavigationBar from 'expo-navigation-bar'
import { Colors } from '@/constants/theme'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import { log } from '@/lib/log'
import { supabase } from '@/lib/supabase'

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {})
      NavigationBar.setVisibilityAsync('hidden').catch(() => {})
    }
  }, [])

  useEffect(() => {
    // RC public SDK keys are safe to embed client-side per RevenueCat docs.
    // Fallback to hardcoded values so missing EXPO_PUBLIC_* env vars at build
    // time don't silently skip Purchases.configure (bug seen on preview builds).
    const apiKey = Platform.OS === 'ios'
      ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_sduYBgvZbdDiZKSTnLusMUCvnMe')
      : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_ewXuQUIyIPxPFkApTRFcQsLIktY')
    if (apiKey) {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN)
      try {
        Purchases.configure({ apiKey })
      } catch (err) {
        log.warn('[rc][aura][configure] Purchases.configure failed:', err)
      }
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        supabase.auth.signInAnonymously().catch((err) => {
          log.warn('[aura][auth] signInAnonymously failed:', err)
        })
      }
    })
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar style="light" backgroundColor={Colors.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="questionnaire" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="aura-result" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="camera" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="history" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="learn" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="paywall" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      </Stack>
    </View>
  )
}
