import { useEffect, useState } from 'react'
import { Text, TextProps } from 'react-native'
import { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated'

type AnimatedValueTextProps = {
  value: number
  duration?: number
  format: (value: number) => string
  fallback?: string
} & Omit<TextProps, 'children'>

const DEFAULT_DURATION_MS = 650

export function AnimatedValueText({
  value,
  duration = DEFAULT_DURATION_MS,
  format,
  fallback = '-',
  ...textProps
}: AnimatedValueTextProps) {
  const numericValue = Number.isFinite(value) ? value : Number.NaN
  const [displayValue, setDisplayValue] = useState(() => (Number.isFinite(numericValue) ? numericValue : Number.NaN))
  const animatedValue = useSharedValue(Number.isFinite(numericValue) ? numericValue : 0)

  useEffect(() => {
    if (!Number.isFinite(numericValue)) {
      setDisplayValue(Number.NaN)
      return
    }

    if (!Number.isFinite(displayValue)) {
      animatedValue.value = numericValue
      setDisplayValue(numericValue)
      return
    }

    animatedValue.value = withTiming(numericValue, { duration })
  }, [animatedValue, displayValue, duration, numericValue])

  useAnimatedReaction(
    () => animatedValue.value,
    (next, previous) => {
      if (next === previous) return
      runOnJS(setDisplayValue)(next)
    }
  )

  return <Text {...textProps}>{Number.isFinite(displayValue) ? format(displayValue) : fallback}</Text>
}
