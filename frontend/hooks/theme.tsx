import { Colors } from '@/constants/design'
import type { ThemeContextType, ThemeMode } from '@/types/hooks'
import { useColorScheme } from 'nativewind'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme as useSystemColorScheme } from 'react-native'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme()
  const { setColorScheme } = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>('system')

  // 마운트 시 NativeWind 초기 동기화
  useEffect(() => {
    setColorScheme('system')
  }, [])

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const setMode = (m: ThemeMode) => {
    setModeState(m)
    setColorScheme(m === 'system' ? 'system' : m)
  }

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
