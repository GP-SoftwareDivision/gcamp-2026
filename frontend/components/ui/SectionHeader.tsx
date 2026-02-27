import { useTheme } from '@/hooks/theme'
import type { SectionHeaderProps, SectionLabelProps } from '@/types/ui'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

const ACTION_DARK = '#8E8E93'
const ACTION_LIGHT = '#636366'

export function SectionHeader({ title, action, className = '' }: SectionHeaderProps) {
  const { isDark } = useTheme()
  const actionColor = isDark ? ACTION_DARK : ACTION_LIGHT

  return (
    <View className={`flex-row items-center justify-between mb-3 ${className}`}>
      <Text className='text-headline font-semibold text-content dark:text-content-dark'>
        {title}
      </Text>
      {action ? (
        <Pressable
          onPress={action.onPress}
          className='flex-row items-center gap-1'
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className='text-subhead' style={{ color: actionColor }}>
            {action.label}
          </Text>
          <ChevronRight size={16} color={actionColor} strokeWidth={1.8} />
        </Pressable>
      ) : null}
    </View>
  )
}

export function SectionLabel({ title, className = '' }: SectionLabelProps) {
  return (
    <Text
      className={`text-headline font-semibold text-content dark:text-content-dark mb-3 ${className}`}
    >
      {title}
    </Text>
  )
}
