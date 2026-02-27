import type { ReactNode } from 'react'

export interface MenuItemProps {
  icon: ReactNode
  label: string
  value?: string
  onPress?: () => void
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: (value: boolean) => void
  isDark?: boolean
}
