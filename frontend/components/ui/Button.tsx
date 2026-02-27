import { useTheme } from '@/hooks/theme'
import type { ButtonProps } from '@/types/ui'
import React from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const { isDark } = useTheme()
  const baseClass = 'flex-row items-center justify-center rounded-md'

  const variantClass = {
    primary: 'bg-black dark:bg-white',
    secondary: 'bg-card dark:bg-card-dark border border-border dark:border-border-dark',
    ghost: 'bg-transparent',
    danger: 'bg-danger dark:bg-danger-dark',
  }[variant]

  const sizeClass = {
    sm: 'h-9 px-3 gap-1.5',
    md: 'h-12 px-4 gap-2',
    lg: 'h-14 px-6 gap-2.5',
  }[size]

  const textVariantClass = {
    primary: 'text-white dark:text-black',
    secondary: 'text-content dark:text-content-dark',
    ghost: 'text-primary',
    danger: 'text-white',
  }[variant]

  const textSizeClass = {
    sm: 'text-subhead',
    md: 'text-headline',
    lg: 'text-headline',
  }[size]

  const disabledClass = disabled ? 'opacity-50' : ''
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${sizeClass} ${disabledClass} ${widthClass} ${className}`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        borderCurve: 'continuous',
      })}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? isDark
                ? '#000000'
                : '#FFFFFF'
              : variant === 'secondary' || variant === 'ghost'
                ? isDark ? '#0A84FF' : '#007AFF'
                : '#fff'
          }
        />
      ) : (
        <>
          {icon != null && iconPosition === 'left' ? icon : null}
          <Text className={`${textVariantClass} ${textSizeClass} font-semibold`}>{title}</Text>
          {icon != null && iconPosition === 'right' ? icon : null}
        </>
      )}
    </Pressable>
  )
}
