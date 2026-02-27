import type { NativeScrollEvent } from 'react-native'

export function isNearBottomOnScroll(event: NativeScrollEvent, threshold = 140): boolean {
  const { layoutMeasurement, contentOffset, contentSize } = event
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold
}
