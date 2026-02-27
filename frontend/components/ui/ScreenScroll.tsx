import { useRefresh } from '@/hooks/useRefresh'
import type { ScreenScrollProps } from '@/types/ui'
import { forwardRef } from 'react'
import { ScrollView } from 'react-native'

/**
 * ��ũ�� + ��ܼ� ���ΰ�ħ�� �� ����.
 */
const ScreenScroll = forwardRef<ScrollView, ScreenScrollProps>(
  ({ onRefetch, contentContainerClassName, contentContainerStyle, className, style, children, ...rest }, ref) => {
    const { refreshControl } = useRefresh(onRefetch)
    return (
      <ScrollView
        ref={ref}
        style={[{ flex: 1 }, style]}
        showsVerticalScrollIndicator
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName={contentContainerClassName}
        contentContainerStyle={contentContainerStyle}
        className={className}
        refreshControl={refreshControl}
        {...rest}
      >
        {children}
      </ScrollView>
    )
  }
)
ScreenScroll.displayName = 'ScreenScroll'

export { ScreenScroll }
