import { DEFAULT_SELECT_OPTION, SEARCH_COUNT, SEARCH_PAGE } from '@/constants/marketSearch'
import { marketApi } from '@/services/api'
import type { RecentMarketPriceItem } from '@/services/api/features/market'
import type {
  MarketSearchFilters,
  MarketSearchSelectOption,
  MarketSearchTableRecord,
  MarketSearchUnitOptionsMap,
} from '@/types/pages/tabs'
import { buildSelectOptions, normalizeSearchRecords } from '@/utils/marketSearch'
import { useCallback, useEffect, useRef, useState } from 'react'

async function fetchRecentMarketPriceItems(): Promise<RecentMarketPriceItem[]> {
  const response = await marketApi.getRecentlyPrices()
  const items = response.data?.result?.items
  const normalizedItems = Array.isArray(items) ? items : []

  console.log('[MarketSearch] recently response', {
    success: response.success,
    itemGroupCount: normalizedItems.length,
    sampleGroup: normalizedItems[0] ?? null,
  })

  return normalizedItems
}

type MarketSearchPageResult = {
  records: MarketSearchTableRecord[]
  page: number
  totalPages: number
}

type MarketSearchOptionsState = {
  itemOptions: MarketSearchSelectOption[]
  unitOptions: MarketSearchSelectOption[]
  gradeOptions: MarketSearchSelectOption[]
  unitOptionsByItemCode: MarketSearchUnitOptionsMap
  isOptionLoading: boolean
}

const INITIAL_OPTIONS_STATE: MarketSearchOptionsState = {
  itemOptions: [DEFAULT_SELECT_OPTION],
  unitOptions: [DEFAULT_SELECT_OPTION],
  gradeOptions: [DEFAULT_SELECT_OPTION],
  unitOptionsByItemCode: {},
  isOptionLoading: false,
}

type MarketSearchRecordsState = {
  records: MarketSearchTableRecord[]
  isLoading: boolean
  isLoadingMore: boolean
  hasSearched: boolean
  errorMessage: string | null
  currentPage: number
  totalPages: number
}

const INITIAL_RECORDS_STATE: MarketSearchRecordsState = {
  records: [],
  isLoading: false,
  isLoadingMore: false,
  hasSearched: false,
  errorMessage: null,
  currentPage: 0,
  totalPages: 0,
}

async function fetchMarketSearchRecords(
  filters: MarketSearchFilters,
  page: number,
): Promise<MarketSearchPageResult> {
  const requestParams = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    itemCode: filters.itemCode,
    grade: filters.grade,
    unit: filters.unitName,
    page,
    count: SEARCH_COUNT,
  }

  console.log('[MarketSearch] 검색 요청', requestParams)

  const response = await marketApi.searchMarketPrices(requestParams)
  const result = response.data?.result
  const records = normalizeSearchRecords(result?.records)
  const currentPage = result?.page ?? page
  const totalPages = result?.totalPages ?? (records.length > 0 ? currentPage : 0)

  console.log('[MarketSearch] 검색 응답', {
    success: response.success,
    itemCode: result?.itemCode,
    grade: result?.grade,
    unit: result?.unit,
    startDate: result?.startDate,
    endDate: result?.endDate,
    page: result?.page,
    count: result?.count,
    totalElements: result?.totalElements,
    totalPages,
    recordsLength: records.length,
    sampleRecord: records[0] ?? null,
  })

  return { records, page: currentPage, totalPages }
}

export function useMarketSearchOptions() {
  const [optionsState, setOptionsState] = useState<MarketSearchOptionsState>(INITIAL_OPTIONS_STATE)

  useEffect(() => {
    let mounted = true

    const loadOptions = async () => {
      setOptionsState((prev) => ({
        ...prev,
        isOptionLoading: true,
      }))

      try {
        const items = await fetchRecentMarketPriceItems()
        if (!mounted) return

        const mapped = buildSelectOptions(items)
        setOptionsState({
          itemOptions: mapped.itemOptions,
          unitOptions: mapped.unitOptions,
          gradeOptions: mapped.gradeOptions,
          unitOptionsByItemCode: mapped.unitOptionsByItemCode,
          isOptionLoading: false,
        })
      } catch (error) {
        console.log('[MarketSearch] 옵션 로딩 실패', error)

        if (!mounted) return
        setOptionsState({
          ...INITIAL_OPTIONS_STATE,
          isOptionLoading: false,
        })
      }
    }

    loadOptions().catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [])

  return {
    itemOptions: optionsState.itemOptions,
    unitOptions: optionsState.unitOptions,
    gradeOptions: optionsState.gradeOptions,
    unitOptionsByItemCode: optionsState.unitOptionsByItemCode,
    isOptionLoading: optionsState.isOptionLoading,
  }
}

export function useMarketSearchRecords() {
  const [recordsState, setRecordsState] = useState<MarketSearchRecordsState>(INITIAL_RECORDS_STATE)
  const activeFiltersRef = useRef<MarketSearchFilters | null>(null)
  const isLoadingMoreRef = useRef(false)

  const search = async (filters: MarketSearchFilters, isSearchValid: boolean) => {
    if (!isSearchValid) {
      console.log('[MarketSearch] 검색 차단 - validation 실패', filters)
      setRecordsState((prev) => ({
        ...prev,
        records: [],
        errorMessage: null,
        currentPage: 0,
        totalPages: 0,
      }))
      return
    }

    activeFiltersRef.current = filters
    setRecordsState((prev) => ({
      ...prev,
      hasSearched: true,
      isLoading: true,
      errorMessage: null,
    }))

    try {
      const result = await fetchMarketSearchRecords(filters, SEARCH_PAGE)
      setRecordsState((prev) => ({
        ...prev,
        records: result.records,
        currentPage: result.page,
        totalPages: result.totalPages,
      }))
    } catch (error) {
      console.log('[MarketSearch] 검색 실패', error)
      setRecordsState((prev) => ({
        ...prev,
        errorMessage: '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        records: [],
        currentPage: 0,
        totalPages: 0,
      }))
    } finally {
      setRecordsState((prev) => ({
        ...prev,
        isLoading: false,
      }))
    }
  }

  const loadMore = async () => {
    if (recordsState.isLoading || isLoadingMoreRef.current) return
    if (recordsState.currentPage <= 0) return
    if (recordsState.totalPages > 0 && recordsState.currentPage >= recordsState.totalPages) return
    if (!activeFiltersRef.current) return

    const nextPage = recordsState.currentPage + 1
    isLoadingMoreRef.current = true
    setRecordsState((prev) => ({
      ...prev,
      isLoadingMore: true,
    }))

    try {
      const result = await fetchMarketSearchRecords(activeFiltersRef.current, nextPage)
      setRecordsState((prev) => ({
        ...prev,
        records: [...prev.records, ...result.records],
        currentPage: result.page,
        totalPages: result.totalPages,
      }))
    } catch (error) {
      console.log('[MarketSearch] 추가 페이지 로딩 실패', error)
    } finally {
      isLoadingMoreRef.current = false
      setRecordsState((prev) => ({
        ...prev,
        isLoadingMore: false,
      }))
    }
  }

  // Stable reference is required because focus lifecycle effects depend on this function identity.
  const reset = useCallback(() => {
    activeFiltersRef.current = null
    isLoadingMoreRef.current = false
    setRecordsState(INITIAL_RECORDS_STATE)
  }, [])

  const hasMore =
    recordsState.totalPages > 0 && recordsState.currentPage < recordsState.totalPages

  return {
    records: recordsState.records,
    isLoading: recordsState.isLoading,
    isLoadingMore: recordsState.isLoadingMore,
    hasSearched: recordsState.hasSearched,
    errorMessage: recordsState.errorMessage,
    currentPage: recordsState.currentPage,
    hasMore,
    search,
    loadMore,
    reset,
  }
}
