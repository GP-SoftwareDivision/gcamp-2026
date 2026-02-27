import type { MarketSearchRecord } from '@/services/api/features/market'

export type MarketSearchSelectOption = {
  label: string
  value: string
}

export type MarketSearchUnitOptionsMap = Record<string, MarketSearchSelectOption[]>

export type MarketSearchFilters = {
  startDate: string
  endDate: string
  itemCode: string | null
  grade: string | null
  unitName: string | null
}

export type MarketSearchTableColumnKey =
  | 'priceDate'
  | 'itemName'
  | 'gradeName'
  | 'unitName'
  | 'averagePrice'

export type MarketSearchTableRecord = Pick<
  MarketSearchRecord,
  'id' | 'priceDate' | 'itemName' | 'gradeName' | 'unitName' | 'averagePrice'
>
