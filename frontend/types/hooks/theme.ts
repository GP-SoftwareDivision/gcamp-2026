export type ThemeMode = 'light' | 'dark' | 'system'
export type Theme = typeof import('@/constants/design').Colors.light

export interface ThemeContextType {
  mode: ThemeMode
  isDark: boolean
  colors: Theme
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

