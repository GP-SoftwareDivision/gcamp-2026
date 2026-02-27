/**
 * 화면 공통 스타일 시트
 * - 에러 메시지, PTZ 패드 등 화면별 공통 UI (테마 의존 스타일은 함수로 제공)
 */
import { StyleSheet, TextStyle, ViewStyle } from 'react-native'
import { Colors } from '@/constants/design'

// ========== 카메라 에러 영역 ==========

const cameraErrorStatic = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  messageBlock: {
    alignItems: 'center',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
})

/** 카메라 접속 불량 영역 컨테이너 (width / minHeight는 호출부에서 Dimensions로 주입) */
export function getCameraErrorContainerStyle(
  width: number,
  minHeight: number
): ViewStyle {
  return {
    ...cameraErrorStatic.container,
    width,
    minHeight,
    backgroundColor: '#1C1C1E',
  }
}

/** 카메라 에러 문구 텍스트 스타일 (라이트/다크) */
export function getCameraErrorTextStyles(isDark: boolean): {
  errorTitle: TextStyle
  errorSubtitle: TextStyle
} {
  return {
    errorTitle: {
      ...cameraErrorStatic.errorTitle,
      color: isDark ? Colors.dark.danger : Colors.light.danger,
    },
    errorSubtitle: {
      ...cameraErrorStatic.errorSubtitle,
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.72)',
    },
  }
}

export const cameraErrorStyles = {
  messageBlock: cameraErrorStatic.messageBlock,
}

// ========== 카메라 PTZ 패드 ==========

const ptzStatic = StyleSheet.create({
  pad: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  directionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
})

/** PTZ 원형 패드 컨테이너 (테마 의존) */
export function getPtzPadStyle(isDark: boolean): ViewStyle {
  return {
    ...ptzStatic.pad,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
    backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
    shadowOpacity: isDark ? 0.4 : 0.12,
  }
}

/** PTZ 방향 버튼 공통 크기 */
export const ptzDirectionButtonStyle = ptzStatic.directionButton

/** PTZ 버튼 눌렀을 때 스타일 (pressed, isDark) */
export function getPtzPressedStyle(pressed: boolean, isDark: boolean): ViewStyle {
  if (!pressed) {
    return { opacity: 1, transform: [{ scale: 1 }], backgroundColor: 'transparent' }
  }
  return {
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
  }
}

/** PTZ 버튼 아이콘 색 (pressed, isDark) */
export function getPtzIconColor(pressed: boolean, isDark: boolean): string {
  if (pressed) return isDark ? Colors.dark.primary : Colors.light.primary
  return isDark ? '#C5C5C5' : '#3C3C43'
}
