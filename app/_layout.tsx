import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform, View } from 'react-native'
import { Colors } from '@/constants/theme'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import { log } from '@/lib/log'

export default function RootLayout() {
  useEffect(() => {
    const apiKey = Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? ''
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? ''
    if (apiKey) {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.VERBOSE)
      try {
        Purchases.configure({ apiKey })
      } catch (err) {
        log.warn('[rc][aura][configure] Purchases.configure failed:', err)
      }
    }
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
