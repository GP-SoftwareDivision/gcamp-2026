import type { TomatoSection } from '@/types/pages/tabs'

export interface SelectedMarketQuery {
  itemCode: string
  gradeName: string
  itemName: string
  unitName: string
}

export interface MarketStore {
  sections: TomatoSection[]
  cacheDateKey: string | null
  isLoading: boolean
  requestInFlight: Promise<TomatoSection[]> | null
  selectedQuery: SelectedMarketQuery | null
  setSelectedQuery: (query: SelectedMarketQuery | null) => void
  fetchRecentlyPrices: (options?: { force?: boolean }) => Promise<TomatoSection[]>
}
