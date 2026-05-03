import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { Colors } from '@/constants/theme'

export default function RootLayout() {
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
      </Stack>
    </View>
  )
}
