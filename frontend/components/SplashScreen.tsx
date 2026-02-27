import { useTheme } from '@/hooks/theme'
import type { SplashScreenProps } from '@/types/ui'
import { useRef } from 'react'
import { Animated, Dimensions, Easing, Image, StyleSheet, View } from 'react-native'

const { width, height } = Dimensions.get('window')

// 저 멀리 (사선 구석) → 빠르게 날아와서 딱 박히는 연출
const FLY_FROM_X = -width * 0.9
const FLY_FROM_Y = -height * 0.35

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { isDark } = useTheme()
  const posX = useRef(new Animated.Value(FLY_FROM_X)).current
  const posY = useRef(new Animated.Value(FLY_FROM_Y)).current
  const scale = useRef(new Animated.Value(0.18)).current
  const opacity = useRef(new Animated.Value(0.5)).current
  const scaleImpact = useRef(new Animated.Value(1)).current
  const fadeOut = useRef(new Animated.Value(1)).current
  const scaleOut = useRef(new Animated.Value(1)).current
  const started = useRef(false)

  function runAnimation() {
    if (started.current) return
    started.current = true
    Animated.sequence([
      Animated.parallel([
        Animated.timing(posX, {
          toValue: 0,
          duration: 580,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(posY, {
          toValue: 0,
          duration: 580,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.spring(scaleImpact, {
          toValue: 1.28,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleImpact, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleOut, {
          toValue: 0.88,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onFinish())
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F0EEE9' }]} onLayout={runAnimation}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: Animated.multiply(opacity, fadeOut),
            transform: [
              { translateX: posX },
              { translateY: posY },
              { scale: Animated.multiply(Animated.multiply(scale, scaleImpact), scaleOut) },
            ],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode='contain'
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
})
