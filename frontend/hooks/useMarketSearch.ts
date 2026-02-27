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
  const [itemOptions, setItemOptions] = useState<MarketSearchSelectOption[]>([DEFAULT_SELECT_OPTION])
  const [unitOptions, setUnitOptions] = useState<MarketSearchSelectOption[]>([DEFAULT_SELECT_OPTION])
  const [gradeOptions, setGradeOptions] = useState<MarketSearchSelectOption[]>([DEFAULT_SELECT_OPTION])
  const [unitOptionsByItemCode, setUnitOptionsByItemCode] = useState<MarketSearchUnitOptionsMap>(
    {},
  )
  const [isOptionLoading, setIsOptionLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadOptions = async () => {
      setIsOptionLoading(true)

      try {
        const items = await fetchRecentMarketPriceItems()
        if (!mounted) return

        const mapped = buildSelectOptions(items)
        setItemOptions(mapped.itemOptions)
        setUnitOptions(mapped.unitOptions)
        setGradeOptions(mapped.gradeOptions)
        setUnitOptionsByItemCode(mapped.unitOptionsByItemCode)
      } catch (error) {
        console.log('[MarketSearch] 옵션 로딩 실패', error)

        if (!mounted) return
        setItemOptions([DEFAULT_SELECT_OPTION])
        setUnitOptions([DEFAULT_SELECT_OPTION])
        setGradeOptions([DEFAULT_SELECT_OPTION])
        setUnitOptionsByItemCode({})
      } finally {
        if (mounted) {
          setIsOptionLoading(false)
        }
      }
    }

    loadOptions().catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [])

  return {
    itemOptions,
    unitOptions,
    gradeOptions,
    unitOptionsByItemCode,
    isOptionLoading,
  }
}

export function useMarketSearchRecords() {
  const [records, setRecords] = useState<MarketSearchTableRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const activeFiltersRef = useRef<MarketSearchFilters | null>(null)
  const isLoadingMoreRef = useRef(false)

  const search = useCallback(async (filters: MarketSearchFilters, isSearchValid: boolean) => {
    if (!isSearchValid) {
      console.log('[MarketSearch] 검색 차단 - validation 실패', filters)
      setRecords([])
      setCurrentPage(0)
      setTotalPages(0)
      return
    }

    activeFiltersRef.current = filters
    setHasSearched(true)
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await fetchMarketSearchRecords(filters, SEARCH_PAGE)
      setRecords(result.records)
      setCurrentPage(result.page)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.log('[MarketSearch] 검색 실패', error)
      setErrorMessage('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setRecords([])
      setCurrentPage(0)
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMoreRef.current) return
    if (currentPage <= 0) return
    if (totalPages > 0 && currentPage >= totalPages) return
    if (!activeFiltersRef.current) return

    const nextPage = currentPage + 1
    isLoadingMoreRef.current = true
    setIsLoadingMore(true)

    try {
      const result = await fetchMarketSearchRecords(activeFiltersRef.current, nextPage)
      setRecords((prev) => [...prev, ...result.records])
      setCurrentPage(result.page)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.log('[MarketSearch] 추가 페이지 로딩 실패', error)
    } finally {
      isLoadingMoreRef.current = false
      setIsLoadingMore(false)
    }
  }, [currentPage, isLoading, totalPages])

  const reset = useCallback(() => {
    activeFiltersRef.current = null
    isLoadingMoreRef.current = false
    setRecords([])
    setErrorMessage(null)
    setHasSearched(false)
    setIsLoading(false)
    setIsLoadingMore(false)
    setCurrentPage(0)
    setTotalPages(0)
  }, [])

  const hasMore = totalPages > 0 && currentPage < totalPages

  return {
    records,
    isLoading,
    isLoadingMore,
    hasSearched,
    errorMessage,
    currentPage,
    hasMore,
    search,
    loadMore,
    reset,
  }
}
