import { LabelDotColor } from '@/constants/design'
import { useTheme } from '@/hooks/theme'
import { getCardShadowAndBorder } from '@/styles/cardStyles'
import type { CardProps } from '@/types/ui'
import { Platform, Pressable, Text, View, ViewStyle } from 'react-native'

export function Card({
  children,
  label,
  variant = 'default',
  onPress,
  width,
  className = '',
  style,
}: CardProps) {
  const { isDark } = useTheme()
  const baseClass = 'bg-card dark:bg-card-dark rounded-2xl'
  const combinedClass = `${baseClass} ${className}`.trim()
  const cardStyle: ViewStyle = {
    ...getCardShadowAndBorder(isDark),
    ...(variant === 'elevated' && Platform.OS === 'android' ? { elevation: 6 } : {}),
    ...(width !== undefined && { width }),
  }

  const inner =
    label != null ? (
      <>
        <View className='flex-row items-center mb-2'>
          <View className='w-2 h-2 rounded-full mr-1.5' style={{ backgroundColor: LabelDotColor }} />
          <Text
            className='flex-1 text-subhead text-content-secondary dark:text-content-dark-secondary'
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
        {children}
      </>
    ) : (
      children
    )

  const content =
    label != null ? (
      <View className='p-5 min-h-[100px]'>
        {inner}
      </View>
    ) : (
      inner
    )

  if (onPress) {
    return (
      <View className={combinedClass} style={[cardStyle, style]}>
        <Pressable
          cssInterop={false}
          onPress={onPress}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          {content}
        </Pressable>
      </View>
    )
  }

  return (
    <View className={combinedClass} style={[cardStyle, style]}>
      {content}
    </View>
  )
}
