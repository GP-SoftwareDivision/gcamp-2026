/**
 * 카드 공통 스타일 시트
 * - 카드 **크기·패딩·모양** = 전부 Tailwind로 동일 적용 (iOS/Android)
 * - **쉐도우·보더** = 여기서만 적용 (Android에서 Tailwind shadow/border 제한적)
 */
import { ViewStyle } from 'react-native'
import { AndroidLayout, getCardShadow, IS_ANDROID } from '@/constants/design'

/** 쉐도우 + 보더만 (크기/패딩은 Tailwind로 통일) */
export function getCardShadowAndBorder(isDark: boolean): ViewStyle {
  return {
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    ...getCardShadow(isDark),
  }
}

/** @deprecated getCardShadowAndBorder 사용 */
export function getCardBaseStyle(isDark: boolean): ViewStyle {
  return getCardShadowAndBorder(isDark)
}

/** 섹션/화면 레이아웃 (헤더·패딩 등, 화면별 필요 시 사용) */
export const sectionStyles = {
  paddingHorizontal: IS_ANDROID ? AndroidLayout.paddingHorizontal : 20,
  headerPaddingVertical: IS_ANDROID ? AndroidLayout.headerPaddingVertical : 16,
  titlePaddingTop: IS_ANDROID ? AndroidLayout.paddingHorizontal : 20,
  titleMarginBottom: 12,
  blockMarginBottom: IS_ANDROID ? AndroidLayout.marginBottomBlock : 20,
  scrollBottomPadding: IS_ANDROID ? AndroidLayout.scrollBottomPadding : 96,
} as const
