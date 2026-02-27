import { useTheme } from '@/hooks/theme'
import type { TabBarButtonProps } from '@/types/ui'
import * as Haptics from 'expo-haptics'
import React from 'react'
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

export function AnimatedTabBarButton({
  children,
  onPress,
  style,
  ...rest
}: TabBarButtonProps) {
  const { isDark } = useTheme()
  const isSelected =
    typeof rest.accessibilityState === 'object' &&
    rest.accessibilityState !== null &&
    'selected' in rest.accessibilityState &&
    rest.accessibilityState.selected === true
  const scale = useSharedValue(1)
  const glassOpacity = useSharedValue(0)
  const glassScale = useSharedValue(0.6)

  const handlePressIn = () => {
    if (isSelected) return
    scale.set(0.92)
    glassOpacity.set(isDark ? 0.4 : 0.5)
    glassScale.set(0.85)
  }

  const handlePressOut = () => {
    if (isSelected) return
    scale.set(withSpring(1, { damping: 14, stiffness: 400 }))
    glassOpacity.set(withTiming(0, { duration: 280 }))
    glassScale.set(withTiming(1.35, { duration: 280 }))
  }

  const handlePress = (e: GestureResponderEvent) => {
    if (isSelected) return
    onPress?.(e)
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {}
  }

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }))

  const glassAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glassOpacity.get(),
    transform: [{ scale: glassScale.get() }],
  }))

  // 다크: 흰 유리 / 라이트: 살짝 어두운 톤으로 눌림 느낌 (밝은 배경에서도 보이게)
  const glassColor = isDark
    ? 'rgba(255,255,255,0.22)'
    : 'rgba(0,0,0,0.1)'

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.wrapper, style]}
      {...rest}
    >
      <View style={styles.glassContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.glass,
            { backgroundColor: glassColor },
            glassAnimatedStyle,
          ]}
        />
      </View>
      <Animated.View style={[styles.content, containerAnimatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  glass: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
