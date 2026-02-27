import SplashScreen from '@/components/SplashScreen'
import { ThemeProvider, useTheme } from '@/hooks/theme'
import {
  ThemeProvider as NavThemeProvider,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native'
import { Stack } from 'expo-router'
import * as ExpoSplashScreen from 'expo-splash-screen'
import * as NavigationBar from 'expo-navigation-bar'
import * as SystemUI from 'expo-system-ui'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { AppState, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import 'react-native-reanimated'
import { SWRConfig } from 'swr'
import '../global.css'

// 네이티브 스플래시 숨기지 않도록 설정
ExpoSplashScreen.preventAutoHideAsync().catch(() => {})

if (Platform.OS === 'android') {
  const androidTypographyStyle = { letterSpacing: -1.2 }

  ;(Text as any).defaultProps = {
    ...((Text as any).defaultProps ?? {}),
    style: [((Text as any).defaultProps?.style ?? null), androidTypographyStyle],
  }

  ;(TextInput as any).defaultProps = {
    ...((TextInput as any).defaultProps ?? {}),
    style: [((TextInput as any).defaultProps?.style ?? null), androidTypographyStyle],
  }
}

function RootLayoutNav() {
  const { isDark } = useTheme()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {})
    if (Platform.OS === 'android') {
      const bg = isDark ? '#121212' : '#F0EEE9'
      SystemUI.setBackgroundColorAsync(bg).catch(() => {})
      NavigationBar.setBackgroundColorAsync(bg).catch(() => {})
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {})
    }
  }, [isDark])

  const screenBg = isDark ? '#121212' : '#F0EEE9'
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: screenBg,
      card: screenBg,
    },
  }

  // Stack을 항상 마운트해 NavigationContainer 컨텍스트를 유지하고, 스플래시는 위에 오버레이
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavThemeProvider value={navTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: screenBg },
          }}
        >
          <Stack.Screen name='(auth)' />
          <Stack.Screen name='(tabs)' />
        </Stack>
      </NavThemeProvider>
      {showSplash && (
        <View style={styles.splashOverlay} pointerEvents="box-none">
          <SplashScreen onFinish={() => setShowSplash(false)} />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
})

export default function RootLayout() {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        revalidateOnFocus: true,
        isVisible: () => true,
        isOnline: () => true,
        initFocus(callback) {
          let appState = AppState.currentState
          const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (
              (appState === 'inactive' || appState === 'background') &&
              nextAppState === 'active'
            ) {
              callback()
            }
            appState = nextAppState
          })
          return () => subscription.remove()
        },
      }}
    >
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </SWRConfig>
  )
}
