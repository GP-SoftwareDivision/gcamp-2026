import { useTheme } from '@/hooks/theme'
import { Stack } from 'expo-router'

export default function HomeLayout() {
  const { isDark } = useTheme()
  const screenBg = isDark ? '#121212' : '#F0EEE9'
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: screenBg },
      }}
    />
  )
}
