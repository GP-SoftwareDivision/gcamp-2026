import type { ComponentProps, ReactNode } from 'react'
import type { GestureResponderEvent, StyleProp, TextInputProps, ViewStyle } from 'react-native'
import type { ScrollView } from 'react-native'

export interface ButtonProps {
  title: string
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  className?: string
}

export interface CardProps {
  children: ReactNode
  label?: string
  variant?: 'default' | 'elevated'
  onPress?: () => void
  width?: number
  className?: string
  style?: StyleProp<ViewStyle>
}

export interface IconButtonProps {
  icon: ReactNode
  onPress?: () => void
  variant?: 'default' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface InputProps extends TextInputProps {
  label?: string
  icon?: ReactNode
  error?: string
  hint?: string
  isPassword?: boolean
  className?: string
  containerClassName?: string
}

export interface ScreenLoaderProps {
  fullScreen?: boolean
  size?: 'small' | 'large'
}

export type ScreenScrollProps = ComponentProps<typeof ScrollView> & {
  onRefetch?: () => void | Promise<void>
}

export interface SectionHeaderProps {
  title: string
  action?: {
    label: string
    onPress: () => void
  }
  className?: string
}

export interface SectionLabelProps {
  title: string
  className?: string
}

export interface SplashScreenProps {
  onFinish: () => void
}

export type TabBarButtonProps = {
  children: ReactNode
  onPress?: (e: GestureResponderEvent) => void
  style?: StyleProp<ViewStyle>
  [key: string]: unknown
}
