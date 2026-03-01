import { Card, ScreenLoader, ScreenScroll } from '@/components/ui'
import { AndroidLayout, CHART_HEIGHT, ChartColors, IS_ANDROID } from '@/constants/design'
import { useTheme } from '@/hooks/theme'
import { marketApi } from '@/services/api'
import {
  DAY_MS,
  formatMonthDayKorean,
  parseMarketChartData,
  parseYyyyMmDd,
  readParamValue,
  startOfDay,
  toDatedPoints,
} from '@/shared/marketChart'
import { useMarketStore } from '@/store/marketStore'
import type { DatedPoint, MarketChartData, MarketChartPoint } from '@/types/pages'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, Search } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Dimensions, PixelRatio, Pressable, Text, View } from 'react-native'
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts/dist/LineChart'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type LoadChartResult = {
  chartData: MarketChartData | null
  errorMessage: string
}

type MarketDetailState = {
  chartData: MarketChartData | null
  isLoading: boolean
  errorMessage: string
}

const INITIAL_MARKET_DETAIL_STATE: MarketDetailState = {
  chartData: null,
  isLoading: true,
  errorMessage: '',
}

async function loadMarketChartData(params: {
  itemCode?: string
  gradeName?: string
  itemName: string
  unitName?: string
}): Promise<LoadChartResult> {
  const { itemCode, gradeName, itemName, unitName } = params

  if (!itemCode || !gradeName || !unitName) {
    return {
      chartData: null,
      errorMessage: '품목/등급/단위 정보가 없습니다. 목록에서 다시 선택해 주세요.',
    }
  }

  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayKey = String(yyyy) + mm + dd

  try {
    const response = await marketApi.getSettlementAvgPrices({
      itemCode,
      grade: gradeName,
      unitName,
    })

    const parsed = parseMarketChartData(response, {
      today: todayKey,
      itemCode,
      gradeName,
      itemName,
      unitName,
    })

    if (!parsed) {
      return {
        chartData: null,
        errorMessage: '가격 데이터를 불러오지 못했습니다.',
      }
    }

    return { chartData: parsed, errorMessage: '' }
  } catch {
    return {
      chartData: null,
      errorMessage: '가격 데이터를 불러오는 중 오류가 발생했습니다.',
    }
  }
}

function PriceLineChart({ points, isDark }: { points: MarketChartPoint[]; isDark: boolean }) {
  const [chartContainerWidth, setChartContainerWidth] = useState(0)
  const chartWidth = Math.max((chartContainerWidth || SCREEN_WIDTH - 72) - 16, 220)
  const isFiniteNumber = (value: number | null): value is number =>
    typeof value === 'number' && Number.isFinite(value)

  const fontScale = IS_ANDROID ? PixelRatio.getFontScale() : 1
  const labelFontSize = 10 / fontScale
  const xAxisFontSize = 8 / fontScale
  const labelStyle = { color: '#8E8E93', fontSize: labelFontSize }

  const xAxisLabelStyle = {
    color: '#8E8E93',
    fontSize: xAxisFontSize,
    width: 24,
    textAlign: 'center' as const,
  }
  const dataPointLabelStyle = {
    color: '#8E8E93',
    fontSize: xAxisFontSize,
    width: 24,
    textAlign: 'center' as const,
  }

  const visibleLabelIndices = (() => {
    if (points.length <= 1) return new Set<number>([0])
    const last = points.length - 1
    const targetLabelCount = Math.min(6, points.length)
    if (targetLabelCount <= 1) return new Set<number>([0])
    const step = last / (targetLabelCount - 1)
    const indices = new Set<number>()
    for (let idx = 0; idx < targetLabelCount; idx += 1) {
      indices.add(Math.round(step * idx))
    }
    indices.add(0)
    indices.add(last)
    return indices
  })()

  function findNearValue(values: (number | null)[], index: number): number | null {
    let prevIndex = -1
    for (let i = index - 1; i >= 0; i -= 1) {
      if (isFiniteNumber(values[i])) {
        prevIndex = i
        break
      }
    }
    let nextIndex = -1
    for (let i = index + 1; i < values.length; i += 1) {
      if (isFiniteNumber(values[i])) {
        nextIndex = i
        break
      }
    }

    if (prevIndex !== -1 && nextIndex !== -1) {
      const prevValue = values[prevIndex] as number
      const nextValue = values[nextIndex] as number
      const ratio = (index - prevIndex) / (nextIndex - prevIndex)
      return prevValue + (nextValue - prevValue) * ratio
    }
    return null
  }

  function buildSeries(source: (number | null)[], color: string, includeLabels: boolean) {
    const missingFlags = source.map((value) => !isFiniteNumber(value))
    const processed = source.map((value, index) =>
      isFiniteNumber(value) ? value : findNearValue(source, index),
    )

    const data = processed.map((value, index) => ({
      value: typeof value === 'number' && Number.isFinite(value) ? value : undefined,
      label: includeLabels && visibleLabelIndices.has(index) ? points[index].label : '',
      labelTextStyle: dataPointLabelStyle,
      hideDataPoint: true,
      dataPointColor: missingFlags[index] ? 'transparent' : color,
      rawValue: source[index],
      isMissing: missingFlags[index],
    }))

    const lineSegments: {
      startIndex: number
      endIndex: number
      color: string
      strokeDashArray: number[]
    }[] = []

    return { data, lineSegments, processed }
  }

  const currentRawValues = points.map((point) => point.currentPrice)
  const lastYearRawValues = points.map((point) => point.lastYearAvgPrice)
  const threeYearRawValues = points.map((point) => point.threeYearAvgPrice)

  const currentSeries = buildSeries(currentRawValues, ChartColors.seriesBlue, true)
  const lastYearSeries = buildSeries(lastYearRawValues, ChartColors.seriesGrey, false)
  const threeYearSeries = buildSeries(threeYearRawValues, ChartColors.seriesGreen, false)

  const values = [
    ...currentSeries.processed,
    ...lastYearSeries.processed,
    ...threeYearSeries.processed,
  ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  const minValueBase = values.length > 0 ? Math.min(...values) : 0
  const maxValueBase = values.length > 0 ? Math.max(...values) : 0
  const range = maxValueBase - minValueBase
  const pad = Math.max(range * 0.2, 1000)
  const minValue = Math.max(0, Math.floor((minValueBase - pad) / 100) * 100)
  const maxValue = Math.ceil((maxValueBase + pad) / 100) * 100
  const initialSpacing = 20
  const endSpacing = 70
  const spacing = Math.max(
    1,
    (chartWidth - initialSpacing - endSpacing) / Math.max(points.length - 1, 1),
  )

  return (
    <View
      className='w-full overflow-hidden'
      onLayout={(event) => {
        const width = Math.round(event.nativeEvent.layout.width)
        if (width > 0 && width !== chartContainerWidth) {
          setChartContainerWidth(width)
        }
      }}
    >
      <GiftedLineChart
        data={currentSeries.data as any}
        data2={lastYearSeries.data as any}
        data3={threeYearSeries.data as any}
        width={chartWidth}
        height={CHART_HEIGHT}
        color1={ChartColors.seriesBlue}
        color2={ChartColors.seriesGrey}
        color3={ChartColors.seriesGreen}
        thickness={2.5}
        thickness2={2.5}
        thickness3={2.2}
        strokeDashArray1={[0, 0]}
        strokeDashArray2={[0, 0]}
        strokeDashArray3={[10, 6]}
        curved
        lineSegments={currentSeries.lineSegments}
        lineSegments2={lastYearSeries.lineSegments}
        lineSegments3={threeYearSeries.lineSegments}
        hideDataPoints
        yAxisColor='transparent'
        xAxisColor={isDark ? '#48484A' : '#E5E5EA'}
        yAxisTextStyle={labelStyle}
        xAxisLabelTextStyle={xAxisLabelStyle}
        labelsExtraHeight={26}
        xAxisLabelsVerticalShift={8}
        noOfSections={4}
        maxValue={maxValue - minValue}
        yAxisOffset={minValue}
        formatYLabel={(label: string) => Math.round(Number(label)).toLocaleString()}
        rulesColor={isDark ? '#48484A' : '#E5E5EA'}
        rulesType='solid'
        initialSpacing={initialSpacing}
        endSpacing={endSpacing}
        spacing={spacing}
        disableScroll
        interpolateMissingValues={false}
        extrapolateMissingValues={false}
        showDataPointsForMissingValues={false}
        isAnimated
        animationDuration={500}
        yAxisLabelWidth={56}
        pointerConfig={{
          showPointerStrip: true,
          activatePointersOnLongPress: false,
          activatePointersInstantlyOnTouch: true,
          pointerStripColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
          pointerColor: isDark ? '#FFFFFF' : '#1C1C1E',
          pointer1Color: ChartColors.seriesBlue,
          pointer2Color: ChartColors.seriesGrey,
          pointer3Color: ChartColors.seriesGreen,
          hidePointerForMissingValues: false,
          hidePointerDataPointForMissingValues: false,
          pointerLabelWidth: 170,
          pointerLabelHeight: 84,
          shiftPointerLabelY: 84,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (
            items: { value?: number } | { value?: number }[],
            _secondaryItems?: unknown,
            pointerIndex?: number,
          ) => {
            type PointerRow = { value?: number; index?: number; label?: string }
            const rows = (Array.isArray(items) ? items : [items]) as PointerRow[]

            const rowIndex = rows.find((row) => typeof row.index === 'number')?.index
            const label = rows.find(
              (row) => typeof row.label === 'string' && row.label.length > 0,
            )?.label
            const labelIndex = label ? points.findIndex((point) => point.label === label) : -1
            const idx =
              typeof pointerIndex === 'number' && pointerIndex >= 0
                ? pointerIndex
                : typeof rowIndex === 'number' && rowIndex >= 0
                  ? rowIndex
                  : labelIndex

            const valueText = (
              rawSeries: (number | null)[],
              fallbackItem: PointerRow | undefined,
            ) => {
              const rawValue = idx >= 0 && idx < rawSeries.length ? rawSeries[idx] : undefined
              if (rawValue === null) return '거래없음'
              if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
                return `${Math.round(rawValue).toLocaleString()}원`
              }
              if (typeof fallbackItem?.value === 'number' && Number.isFinite(fallbackItem.value)) {
                return `${Math.round(fallbackItem.value).toLocaleString()}원`
              }
              return '거래없음'
            }

            return (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                }}
              >
                <Text
                  className='font-semibold text-caption-1 text-content dark:text-content-dark'
                  allowFontScaling={false}
                  style={{ fontSize: 15, lineHeight: 20 }}
                >
                  최근 평균: {valueText(currentRawValues, rows[0])}
                </Text>
                <Text
                  className='font-semibold text-caption-1 text-content dark:text-content-dark'
                  allowFontScaling={false}
                  style={{ fontSize: 15, lineHeight: 20 }}
                >
                  작년 평균: {valueText(lastYearRawValues, rows[1])}
                </Text>
                <Text
                  className='font-semibold text-caption-1 text-content dark:text-content-dark'
                  allowFontScaling={false}
                  style={{ fontSize: 15, lineHeight: 20 }}
                >
                  3개년 평균: {valueText(threeYearRawValues, rows[2])}
                </Text>
              </View>
            )
          },
        }}
      />
    </View>
  )
}

export default function MarketDetailScreen() {
  const { isDark } = useTheme()
  const params = useLocalSearchParams<{
    grade?: string
    gradeName?: string
    itemCode?: string
    itemName?: string
    unitName?: string
  }>()
  const selectedQuery = useMarketStore((state) => state.selectedQuery)

  const gradeName =
    readParamValue(params.gradeName) ?? readParamValue(params.grade) ?? selectedQuery?.gradeName
  const itemCode = readParamValue(params.itemCode) ?? selectedQuery?.itemCode
  const itemName = readParamValue(params.itemName) ?? selectedQuery?.itemName ?? ''
  const unitName = readParamValue(params.unitName) ?? selectedQuery?.unitName

  const [detailState, setDetailState] = useState<MarketDetailState>(INITIAL_MARKET_DETAIL_STATE)
  const { chartData, isLoading, errorMessage } = detailState

  const fetchChartData = async () => {
    setDetailState((prev) => ({
      ...prev,
      isLoading: true,
      errorMessage: '',
    }))

    const result = await loadMarketChartData({ itemCode, gradeName, itemName, unitName })
    setDetailState({
      chartData: result.chartData,
      errorMessage: result.errorMessage,
      isLoading: false,
    })
  }

  useEffect(() => {
    let mounted = true

    const run = async () => {
      const result = await loadMarketChartData({ itemCode, gradeName, itemName, unitName })
      if (!mounted) return

      setDetailState({
        chartData: result.chartData,
        errorMessage: result.errorMessage,
        isLoading: false,
      })
    }

    setDetailState((prev) => ({
      ...prev,
      isLoading: true,
      errorMessage: '',
    }))
    void run()

    return () => {
      mounted = false
    }
  }, [gradeName, itemCode, itemName, unitName])

  const todayBaseDate = chartData ? (parseYyyyMmDd(chartData.today) ?? new Date()) : new Date()
  const datedPoints = toDatedPoints(chartData, todayBaseDate)

  const chartDateRangeText = (() => {
    if (!chartData || chartData.points.length === 0) return '-'
    const first = chartData.points[0]?.label ?? '-'
    const last = chartData.points[chartData.points.length - 1]?.label ?? '-'
    return `${first} ~ ${last}`
  })()

  const latestRecentPoint = (() => {
    if (!datedPoints.length) return null
    const todayStart = startOfDay(todayBaseDate).getTime()
    const candidates = datedPoints.filter(
      (point) => point.currentPrice !== null && startOfDay(point.date).getTime() <= todayStart,
    )
    if (!candidates.length) return null

    return candidates.reduce((latest, current) =>
      startOfDay(current.date).getTime() > startOfDay(latest.date).getTime() ? current : latest,
    )
  })()

  const recentPrice = latestRecentPoint?.currentPrice ?? null
  const recentThreeYearPrice = latestRecentPoint?.threeYearAvgPrice ?? null
  const recentDiff =
    recentThreeYearPrice !== null && recentPrice !== null
      ? recentThreeYearPrice - recentPrice
      : null
  const recentPercent =
    recentDiff !== null && recentPrice !== null && recentPrice > 0
      ? Math.round((recentDiff / recentPrice) * 100)
      : null

  const bestSellPoint = (() => {
    if (!datedPoints.length) return null

    const todayStart = startOfDay(todayBaseDate)
    const futureOrToday = datedPoints.filter(
      (point) =>
        point.threeYearAvgPrice !== null &&
        startOfDay(point.date).getTime() >= todayStart.getTime(),
    )
    const candidates =
      futureOrToday.length > 0
        ? futureOrToday
        : datedPoints.filter((point) => point.threeYearAvgPrice !== null)
    if (!candidates.length) return null

    return candidates.reduce(
      (best, current) => {
        if (!best || (current.threeYearAvgPrice ?? 0) > (best.threeYearAvgPrice ?? 0))
          return current
        return best
      },
      null as DatedPoint | null,
    )
  })()

  const bestSellInDays = (() => {
    if (!bestSellPoint) return null
    const todayStart = startOfDay(todayBaseDate)
    const bestStart = startOfDay(bestSellPoint.date)
    return Math.round((bestStart.getTime() - todayStart.getTime()) / DAY_MS)
  })()

  const bestSellText = (() => {
    if (!bestSellPoint || bestSellPoint.threeYearAvgPrice === null) {
      return '예상 최고가를 계산할 데이터가 부족합니다.'
    }
    return `예상 최고가: ${formatMonthDayKorean(bestSellPoint.date)}일 ${Math.round(bestSellPoint.threeYearAvgPrice).toLocaleString()}원`
  })()

  const todayCompareText = (() => {
    if (recentPercent === null)
      return '최근 평균 가격과 3개년 평균 가격을 비교할 데이터가 부족합니다.'
    if (recentPercent === 0) return '최근 평균 가격과 3개년 평균 가격이 같습니다.'
    return ''
  })()

  const recommendationText = (() => {
    if (bestSellInDays === null) return '추천 출하시점을 계산할 데이터가 부족합니다.'
    if (bestSellInDays <= 0) return '오늘 출하를 권장합니다.'
    if (bestSellInDays === 1) return '내일 출하를 권장합니다.'
    return `${bestSellInDays}일 뒤 출하를 권장합니다.`
  })()

  const comparePercentColor =
    recentPercent === null
      ? undefined
      : recentPercent > 0
        ? ChartColors.up
        : recentPercent < 0
          ? ChartColors.down
          : undefined

  const chevronColor = isDark ? '#E0E0E0' : '#1C1C1E'
  const displayTitle = chartData?.itemName ?? itemName

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark'>
      <View
        className='flex-row items-center px-5 py-4 border-b border-border dark:border-border-dark'
        style={
          IS_ANDROID
            ? {
                paddingHorizontal: AndroidLayout.paddingHorizontal,
                paddingVertical: AndroidLayout.headerPaddingVertical,
              }
            : undefined
        }
      >
        <Pressable
          onPress={() => router.replace('/(tabs)/market')}
          className='mr-3 active:opacity-70'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={chevronColor} strokeWidth={1.5} />
        </Pressable>
        <Text
          className='flex-1 font-bold text-title-1 text-content dark:text-content-dark'
          numberOfLines={1}
        >
          {gradeName ? `${displayTitle}(${gradeName})` : displayTitle}
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/market/search',
              params: {
                itemCode: itemCode ?? '',
                itemName: displayTitle,
                gradeName: gradeName ?? '',
                unitName: unitName ?? '',
              },
            })
          }
          className='ml-3 h-9 w-9 items-center justify-center rounded-full border border-border bg-card dark:border-border-dark dark:bg-card-dark'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Search size={20} color={isDark ? '#E0E0E0' : '#8E8E93'} strokeWidth={2} />
        </Pressable>
      </View>

      <ScreenScroll className='flex-1' onRefetch={fetchChartData} contentContainerClassName='pb-24'>
        {isLoading ? (
          <View className='px-5 py-8'>
            <ScreenLoader fullScreen={false} size='small' />
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View className='px-5 py-8'>
            <Text className='text-subhead text-danger'>{errorMessage}</Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && chartData ? (
          <>
            <View
              className='px-5 pt-4'
              style={
                IS_ANDROID
                  ? {
                      paddingHorizontal: AndroidLayout.paddingHorizontal,
                      paddingTop: 14,
                    }
                  : undefined
              }
            >
              <Text className='mb-3 font-semibold text-headline text-content dark:text-content-dark'>
                가격 추이 그래프
              </Text>
              <Card
                className='p-4'
                style={IS_ANDROID ? { padding: AndroidLayout.cardPadding } : undefined}
              >
                <PriceLineChart points={chartData.points} isDark={isDark} />

                <Text className='mt-2 text-body text-content dark:text-content-dark opacity-70'>
                  단위: 원
                </Text>
                <Text className='mt-1 text-body text-content dark:text-content-dark opacity-60'>
                  기간: {chartDateRangeText}
                </Text>

                <View className='flex-row flex-wrap justify-center pt-4 mt-4 border-t gap-x-4 gap-y-2 border-border dark:border-border-dark'>
                  <View className='flex-row items-center'>
                    <View
                      className='w-4 h-0.5 mr-2'
                      style={{ backgroundColor: ChartColors.seriesBlue }}
                    />
                    <Text className='text-caption-1 text-content dark:text-content-dark'>
                      최근 평균
                    </Text>
                  </View>
                  <View className='flex-row items-center'>
                    <View
                      className='w-4 h-0.5 mr-2'
                      style={{ backgroundColor: ChartColors.seriesGrey }}
                    />
                    <Text className='text-caption-1 text-content dark:text-content-dark'>
                      작년 평균
                    </Text>
                  </View>
                  <View className='flex-row items-center'>
                    <View
                      className='w-4 h-0.5 mr-2'
                      style={{ backgroundColor: ChartColors.seriesGreen }}
                    />
                    <Text className='text-caption-1 text-content dark:text-content-dark'>
                      3개년 평균
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            <View
              className='px-5 mt-4'
              style={
                IS_ANDROID
                  ? {
                      paddingHorizontal: AndroidLayout.paddingHorizontal,
                      marginTop: 14,
                    }
                  : undefined
              }
            >
              <Text className='mb-3 font-semibold text-headline text-content dark:text-content-dark'>
                분석 요약
              </Text>
              <Card
                className='p-4'
                style={IS_ANDROID ? { padding: AndroidLayout.cardPadding } : undefined}
              >
                <View className='gap-3'>
                  {bestSellPoint && bestSellPoint.threeYearAvgPrice !== null ? (
                    <Text className='text-body text-content dark:text-content-dark'>
                      예상 최고가: {formatMonthDayKorean(bestSellPoint.date)}일{' '}
                      <Text style={{ color: '#FF3B30' }}>
                        {Math.round(bestSellPoint.threeYearAvgPrice).toLocaleString()}원
                      </Text>
                    </Text>
                  ) : (
                    <Text className='text-body text-content dark:text-content-dark'>
                      {bestSellText}
                    </Text>
                  )}
                  {recentPercent !== null && recentPercent !== 0 ? (
                    <Text className='text-body text-content dark:text-content-dark'>
                      최근 평균 가격보다 3개년 평균 가격이{'\n'}
                      <Text
                        style={comparePercentColor ? { color: comparePercentColor } : undefined}
                      >
                        {Math.abs(recentPercent)}%
                      </Text>{' '}
                      {recentPercent > 0 ? '높습니다.' : '낮습니다.'}
                    </Text>
                  ) : (
                    <Text className='text-body text-content dark:text-content-dark'>
                      {todayCompareText}
                    </Text>
                  )}
                  <Text className='text-body text-content dark:text-content-dark'>
                    {recommendationText}
                  </Text>
                </View>
              </Card>
            </View>
          </>
        ) : null}
      </ScreenScroll>
    </SafeAreaView>
  )
}
