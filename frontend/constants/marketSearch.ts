import type { MarketSearchSelectOption } from '@/types/pages/tabs/marketSearch'

export const SEARCH_PAGE = 1
export const SEARCH_COUNT = 20
export const ALL_OPTION_VALUE = '__ALL__'

export const DEFAULT_SELECT_OPTION: MarketSearchSelectOption = {
  label: '전체',
  value: ALL_OPTION_VALUE,
}

export const GRADE_ORDER: Record<string, number> = { 특: 0, 상: 1, 중: 2, 하: 3 }
