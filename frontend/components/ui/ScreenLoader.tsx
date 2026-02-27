import { useTheme } from '@/hooks/theme'
import type { ScreenLoaderProps } from '@/types/ui'
import { ActivityIndicator, View } from 'react-native'

export function ScreenLoader({ fullScreen = true, size = 'large' }: ScreenLoaderProps) {
  const { isDark } = useTheme()

  return (
    <View className={fullScreen ? 'flex-1 items-center justify-center' : 'py-8 items-center'}>
      <ActivityIndicator size={size} color={isDark ? '#C5C5C5' : '#1C1C1E'} />
    </View>
  )
}
