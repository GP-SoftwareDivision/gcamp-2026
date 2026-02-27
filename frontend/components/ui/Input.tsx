import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react-native'
import type { InputProps } from '@/types/ui'
import { Pressable, Text, TextInput, View } from 'react-native'

export const Input = React.forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    icon,
    error,
    hint,
    isPassword = false,
    className = '',
    containerClassName = '',
    ...props
  }: InputProps,
  ref,
) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const borderClass = error
    ? 'border-danger'
    : isFocused
    ? 'border-primary'
    : 'border-border dark:border-border-dark'

  return (
    <View className={`${className}`}>
      {label ? (
        <Text className='text-subhead text-content dark:text-content-dark mb-1.5 font-medium'>
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center h-14 px-4 gap-3 bg-card dark:bg-card-dark rounded-md border ${borderClass} ${containerClassName}`}
      >
        {icon ? icon : null}

        <TextInput
          ref={ref}
          className='flex-1 text-body text-content dark:text-content-dark'
          placeholderTextColor='#8E8E93'
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {showPassword ? (
              <EyeOff size={20} color='#8E8E93' strokeWidth={1.5} />
            ) : (
              <Eye size={20} color='#8E8E93' strokeWidth={1.5} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? <Text className='text-footnote text-danger mt-1.5'>{error}</Text> : null}

      {hint && !error ? (
        <Text className='text-footnote text-content-tertiary mt-1.5'>{hint}</Text>
      ) : null}
    </View>
  )
})
