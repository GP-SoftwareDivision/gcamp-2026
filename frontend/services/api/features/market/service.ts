import { callApi } from '../../core'
import { API_REQUESTS } from '../../contracts'
import type {
  MarketSearchRequest,
  MarketSearchResponse,
  MarketItemQuery,
  MarketRequestDto,
  SettlementAverageQuery,
  MarketPriceRangeResponse,
  MarketResponse,
  RecentMarketPricesResponse,
  SettlementAvgRangeQuery,
  SettlementTodayQuery,
  WholesaleMarket,
} from './types'

export async function getMarketPrices(params: MarketRequestDto): Promise<MarketResponse> {
  return callApi<MarketResponse, never, MarketRequestDto>({
    ...API_REQUESTS.market.getMarketPrices,
    params,
  })
}

export async function getRecentlyPrices(): Promise<RecentMarketPricesResponse> {
  return callApi<RecentMarketPricesResponse>({
    ...API_REQUESTS.market.getRecentlyPrices,
  })
}

export async function getSettlementPricesByRange(params: MarketRequestDto): Promise<MarketResponse> {
  return callApi<MarketResponse, never, MarketRequestDto>({
    ...API_REQUESTS.market.getSettlementPricesByRange,
    params,
  })
}

export async function collectAndSaveSettlementPrices(
  payload: MarketRequestDto
): Promise<MarketResponse> {
  return callApi<MarketResponse, MarketRequestDto>({
    ...API_REQUESTS.market.collectAndSaveSettlementPrices,
    data: payload,
  })
}

export async function getSettlementAvgPrices(
  params: SettlementAverageQuery
): Promise<MarketPriceRangeResponse> {
  return callApi<MarketPriceRangeResponse, never, SettlementAverageQuery>({
    ...API_REQUESTS.market.getSettlementAvgPrices,
    unwrapResult: false,
    params,
  })
}

export async function getSettlementAvgPricesByWeek(
  params: SettlementTodayQuery
): Promise<MarketResponse> {
  return callApi<MarketResponse, never, SettlementTodayQuery>({
    ...API_REQUESTS.market.getSettlementAvgPricesByWeek,
    params,
  })
}

export async function getSettlementAvgPricesByRange(
  params: SettlementAvgRangeQuery
): Promise<MarketResponse> {
  return callApi<MarketResponse, never, SettlementAvgRangeQuery>({
    ...API_REQUESTS.market.getSettlementAvgPricesByRange,
    params,
  })
}

export async function getMarkets(): Promise<WholesaleMarket[]> {
  return callApi<WholesaleMarket[]>({
    ...API_REQUESTS.market.getMarkets,
  })
}

export async function getItems(params: MarketItemQuery = {}): Promise<MarketResponse> {
  return callApi<MarketResponse, never, MarketItemQuery>({
    ...API_REQUESTS.market.getItems,
    params,
  })
}

export async function searchMarketPrices(
  params: MarketSearchRequest
): Promise<MarketSearchResponse> {
  const { startDate, endDate, itemCode, grade, unit } = params
  const page = params.page ?? 1
  const count = params.count ?? 20
  const requestParams = { startDate, endDate, itemCode, grade, unit, page, count }

  console.log('[marketApi.searchMarketPrices] request', requestParams)
  const response = await callApi<MarketSearchResponse, never, typeof requestParams>({
    ...API_REQUESTS.market.searchMarketPrices,
    params: requestParams,
  })
  const result = response.data?.result
  const recordsLength = Array.isArray(result?.records) ? result.records.length : 0

  console.log('[marketApi.searchMarketPrices] response', {
    success: response.success,
    totalElements: result?.totalElements,
    totalPages: result?.totalPages,
    recordsLength,
    sampleRecord: result?.records?.[0] ?? null,
  })

  return response
}
