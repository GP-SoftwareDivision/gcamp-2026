export interface MarketRequestDto {
  date?: string
  startDate?: string
  endDate?: string
  item?: string
  largeCategory?: string
  midCategory?: string
  smallCategory?: string
  sanji?: string
  market?: string
  cmpCd?: string
  numOfRows?: number
  pageNo?: number
}

export interface WholesaleMarket {
  code: string
  name: string
}

export interface MarketItemQuery {
  largeCode?: string
  midCode?: string
  keyword?: string
}

export interface SettlementAvgRangeQuery {
  startDate: string
  endDate: string
}

export interface SettlementTodayQuery {
  today: string
  itemCode?: string
  gradeName?: string
  grade?: string
}

export interface SettlementAverageQuery {
  itemCode: string
  grade: string
  unitName: string
}

export interface RecentMarketPriceRecord {
  id?: number
  priceDate?: string
  marketName?: string
  itemName?: string
  itemCode?: string
  unitName?: string
  gradeName?: string
  averagePrice?: string | number
}

export interface RecentMarketPriceItem {
  productName?: string
  records?: RecentMarketPriceRecord[]
}

export interface RecentMarketPricesResult {
  today?: string
  items?: RecentMarketPriceItem[]
}

export interface RecentMarketPricesResponse {
  success?: boolean
  data?: {
    result?: RecentMarketPricesResult
  }
  error?: unknown
}

export interface MarketSearchRequest {
  startDate: string
  endDate: string
  itemCode: string | null
  grade: string | null
  unit: string | null
  page?: number
  count?: number
}

export interface MarketSearchRecord {
  id?: number
  priceDate?: string
  marketName?: string
  itemName?: string
  itemCode?: string
  unitName?: string
  gradeName?: string
  averagePrice?: string | number
}

export interface MarketSearchResult {
  itemCode?: string | null
  grade?: string | null
  unit?: string | null
  startDate?: string
  endDate?: string
  page?: number
  count?: number
  size?: number
  totalElements?: number
  totalPages?: number
  records?: MarketSearchRecord[]
}

export interface MarketSearchResponse {
  success?: boolean
  data?: {
    result?: MarketSearchResult
  }
  error?: unknown
}

export interface MarketAveragePoint {
  mmdd?: string
  averagePrice?: string | number | null
}

export interface MarketOneYearAgoPrice {
  marketName?: string
  itemName?: string
  unitName?: string
  gradeName?: string
  averagePrice?: string | number
}

export interface MarketOneYearAgoDate {
  priceDate?: string
  prices?: MarketOneYearAgoPrice[]
}

export interface MarketRecentAverageRange {
  startDate?: string
  endDate?: string
  dates?: MarketOneYearAgoDate[]
}

export interface MarketPriceRangeResult {
  today?: string
  itemCode?: string
  grade?: string
  unitName?: string
  startDate?: string
  endDate?: string
  averages?: MarketAveragePoint[]
  upToMinus7Days?: MarketRecentAverageRange
  oneYearAgoRange?: {
    startDate?: string
    endDate?: string
    dates?: MarketOneYearAgoDate[]
  }
}

export interface MarketPriceRangeResponse {
  success?: boolean
  data?: {
    result?: MarketPriceRangeResult
  }
  error?: unknown
}

export type MarketResponse = Record<string, unknown>
