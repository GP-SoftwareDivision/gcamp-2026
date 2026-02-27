/**
 * G-CAMP Design System 공통 UI
 * - 배경색: 다크모드 #121212(진한 회색), 라이트모드 #E8E6E1(따뜻한 아이보리)
 * - 8배수 그리드 시스템, 기본 여백 16~20px, 자간 -1%~-2%
 */

import { Platform } from 'react-native'

/** Android 환경 확인 (플랫폼 분기 처리를 위한 상수) */
export const IS_ANDROID = Platform.OS === 'android'

/**
 * Android 레이아웃 상수 (크기 및 여백 설정)
 * - 안드로이드 여백은 iOS와 다를 수 있으므로 분기 처리
 * - 공통적으로 사용되는 레이아웃 값들을 상수로 관리
 */
export const AndroidLayout = {
  /** 좌우 기본 여백 */
  paddingHorizontal: 18,
  /** 카드 내부 여백 */
  cardPadding: 14,
  /** 요소 간 기본 간격 */
  gap: 10,
  /** 하단 여백 공간 */
  marginBottomBlock: 14,
  /** 스크롤 하단 여백 (스크롤 시 여유 공간) */
  scrollBottomPadding: 88,
  /** 헤더 상하 여백 (패딩) */
  headerPaddingVertical: 12,
  /** 하단 탭바 높이 (플랫폼별 레이아웃 계산을 위해 정의) */
  tabBarHeight: 62,
  /** 하단 탭바 여백 (안전 영역 제외한 탭바 공간) */
  tabBarBottomOffset: 24,
} as const

export const Colors = {
  light: {
    // Backgrounds - Light & Shadow (Cloud Dancer)
    background: '#E8E6E1',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    // Primary (Brand Blue)
    primary: '#007AFF',
    primaryLight: 'rgba(0, 122, 255, 0.1)',
    // Text
    text: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#8E8E93',
    // System - 경계선 및 아이콘 색상
    border: '#D1D1D6',
    divider: '#C6C6C8',
    icon: '#8E8E93',
    // Semantic
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#5856D6',
    // Tab Bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E5EA',
    tabActive: '#007AFF',
    tabInactive: '#8E8E93',
    // 세그먼트 컨트롤 색상 (선택된 배경 및 텍스트)
    segmentedSelectedBg: '#2C2C2E',
    segmentedSelectedText: '#FFFFFF',
  },
  dark: {
    // Backgrounds - 다크 모드 배경
    background: '#121212',
    card: '#1E1E1E',
    elevated: '#2C2C2E',
    // Primary (Brand Blue)
    primary: '#0A84FF',
    primaryLight: 'rgba(10, 132, 255, 0.15)',
    // Text - 다크 모드 텍스트 색상
    text: '#C5C5C5',
    textSecondary: '#9E9E9E',
    textTertiary: '#8E8E93',
    // System
    border: '#38383A',
    divider: '#38383A',
    icon: '#8E8E93',
    // Semantic
    success: '#30D158',
    warning: '#FF9F0A',
    danger: '#FF453A',
    info: '#5E5CE6',
    // Tab Bar
    tabBar: '#1E1E1E',
    tabBarBorder: '#38383A',
    tabActive: '#0A84FF',
    tabInactive: '#8E8E93',
    // 세그먼트 컨트롤 색상 (선택된 배경 및 텍스트)
    segmentedSelectedBg: '#FFFFFF',
    segmentedSelectedText: '#1C1C1E',
  },
}

/**
 * Pantone Light & Shadow 팔레트
 * 따뜻하고 편안한 느낌의 파스텔 톤 색상 모음
 */
export const LightShadowPalette = {
  cloudDancer: '#E8E6E1', // 부드러운 웜톤 화이트
  veiledVista: '#B8D4C8', // 편안한 민트그린
  balticSea: '#7AB6D9', // 차분한 스카이블루
  goldenMist: '#D9D4A8', // 따뜻한 머스타드
  quietViolet: '#9B8BA8', // 은은한 라벤더
  cloudCover: '#8B7E74', // 부드러운 브라운
  hematite: '#6B5F56', // 진한 웜그레이
  blueFusion: '#5A6B7A', // 깊은 네이비
} as const

/** 라벨 닷(Dot) 기본 색상 */
export const LabelDotColor = LightShadowPalette.cloudCover

/**
 * 차트 데이터 색상 (대비가 뚜렷한 색상으로 구성)
 */
export const ChartColors = {
  // 최근 평균 / 작년 평균 / 3년 평균 등 비교용
  seriesBlue: '#2563EB',
  seriesGrey: '#F97316',
  seriesGreen: '#10B981',
  seriesAccent: '#7C3AED',
  // 연도별 데이터 색상
  series1y: '#F97316',
  series2y: '#2563EB',
  series3y: '#10B981',
  /** 가격 상승 (Red) */
  up: '#FF3B30',
  /** 가격 하락 (Blue) */
  down: '#0A84FF',
} as const

/** 차트 기본 높이 */
export const CHART_HEIGHT = 240

/**
 * 다크모드/라이트모드에 따른 카드 그림자 스타일 생성 함수
 * 라이트모드에서는 부드러운 그림자를, 다크모드에서는 그림자 없이 평면적으로 처리
 */
export function getCardShadow(isDark: boolean) {
  if (isDark) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    }
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  }
}
