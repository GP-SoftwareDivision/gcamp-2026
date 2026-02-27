import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

type TabHeaderProps = {
  title: string
  containerClassName?: string
  rightAction?: {
    icon: ReactNode
    onPress: () => void
    accessibilityLabel: string
  }
}

export function TabHeader({ title, containerClassName = '', rightAction }: TabHeaderProps) {
  return (
    <View className={`px-5 py-4 ${containerClassName}`.trim()}>
      <View className='flex-row items-center justify-between'>
        <Text className='flex-1 text-title-1 font-bold text-content dark:text-content-dark'>{title}</Text>
        {rightAction ? (
          <Pressable
            accessibilityRole='button'
            accessibilityLabel={rightAction.accessibilityLabel}
            hitSlop={10}
            onPress={rightAction.onPress}
            className='ml-3 h-9 w-9 items-center justify-center rounded-full border border-border bg-card dark:border-border-dark dark:bg-card-dark'
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {rightAction.icon}
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
