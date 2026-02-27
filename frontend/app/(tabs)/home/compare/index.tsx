import { Card, ScreenLoader, ScreenScroll } from '@/components/ui'
import { AndroidLayout, ChartColors, IS_ANDROID } from '@/constants/design'
import { useTheme } from '@/hooks/theme'
import { sensorApi } from '@/services/api'
import { useUiPrefsStore } from '@/store/uiPrefsStore'
import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { Dimensions, Pressable, Text, View } from 'react-native'
import { RadarChart } from 'react-native-gifted-charts'
import { SafeAreaView } from 'react-native-safe-area-context'
import useSWR from 'swr'

type AxisConfig = {
  key: string
  label: string
  sensorType: string
}

type CompareRadarData = {
  labels: string[]
  leaderSeries: number[]
  mySeries: number[]
  lowerLabels: string[]
  higherLabels: string[]
  comparableCount: number
}

const AXES: AxisConfig[] = [
  { key: 'hydrogenIon', label: 'pH', sensorType: 'hydrogenIon' },
  { key: 'insolation', label: '광량', sensorType: 'insolation' },
  { key: 'carbondioxide', label: 'CO2', sensorType: 'carbondioxide' },
  { key: 'humidity', label: '습도', sensorType: 'humidity' },
  { key: 'temperature', label: '온도', sensorType: 'temperature' },
  { key: 'soilWater', label: '근권습도', sensorType: 'soilWater' },
  { key: 'soilTemperature', label: '근권온도', sensorType: 'soilTemperature' },
  { key: 'ec', label: 'EC', sensorType: 'ec' },
]

const { width } = Dimensions.get('window')
const CARD_PADDING = 40
const MAX_CHART_WIDTH = width - CARD_PADDING
const LABEL_MARGIN = 44
const CHART_SIZE = MAX_CHART_WIDTH - LABEL_MARGIN * 2
const CHART_CONTAINER_SIZE = MAX_CHART_WIDTH
const CHART_SHIFT = LABEL_MARGIN

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string') {
    const normalized = value.replaceAll(',', '').trim()
    if (!normalized) return null
    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

function toRows(value: unknown): Record<string, unknown>[] {
  const parsed = tryParseJson(value)
  if (!Array.isArray(parsed)) return []

  return parsed
    .map((item) => asRecord(item))
    .filter((row): row is Record<string, unknown> => row !== null)
}

function readLatestFromRows(rows: Record<string, unknown>[]): number | null {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i]
    const value = toNumber(row.avgValue) ?? toNumber(row.value)
    if (value !== null) return value
  }
  return null
}

function readLatestFromSeries(seriesValue: unknown): number | null {
  const parsed = tryParseJson(seriesValue)
  if (Array.isArray(parsed)) return readLatestFromRows(toRows(parsed))

  const record = asRecord(parsed)
  if (!record) return null

  const periods: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly']
  for (const period of periods) {
    const rows = toRows(record[period])
    const latest = readLatestFromRows(rows)
    if (latest !== null) return latest
  }

  const fallbackKeys = ['items', 'records', 'list'] as const
  for (const key of fallbackKeys) {
    const rows = toRows(record[key])
    const latest = readLatestFromRows(rows)
    if (latest !== null) return latest
  }

  return null
}

function extractLatestMyLeader(raw: unknown): { my: number | null; leader: number | null } {
  const root = asRecord(tryParseJson(raw))
  if (!root) return { my: null, leader: null }

  const rootData = asRecord(tryParseJson(root.data))
  const rootResult = asRecord(tryParseJson(root.result))
  const rootDataResult = asRecord(tryParseJson(rootData?.result))
  const rootResultData = asRecord(tryParseJson(rootResult?.data))

  const candidates = [rootData, rootResult, rootDataResult, rootResultData, root].filter(
    (candidate): candidate is Record<string, unknown> => candidate !== null,
  )

  for (const candidate of candidates) {
    if (!('my' in candidate) && !('leader' in candidate)) continue
    return {
      my: readLatestFromSeries(candidate.my),
      leader: readLatestFromSeries(candidate.leader),
    }
  }

  return { my: null, leader: null }
}

function normalizePair(my: number | null, leader: number | null): [number, number] {
  const hasMy = typeof my === 'number' && Number.isFinite(my)
  const hasLeader = typeof leader === 'number' && Number.isFinite(leader)

  if (!hasMy && !hasLeader) return [0, 0]
  if (hasMy && !hasLeader) return [100, 0]
  if (!hasMy && hasLeader) return [0, 100]

  const myValue = my as number
  const leaderValue = leader as number
  const max = Math.max(Math.abs(myValue), Math.abs(leaderValue), 1)
  return [Math.round((myValue / max) * 100), Math.round((leaderValue / max) * 100)]
}

async function fetchCompareRadarData(): Promise<CompareRadarData> {
  const rows = await Promise.all(
    AXES.map(async (axis) => {
      try {
        const raw = await sensorApi.getSensorTypeSummary({ sensorType: axis.sensorType })
        const latest = extractLatestMyLeader(raw)
        return { axis, my: latest.my, leader: latest.leader }
      } catch {
        return { axis, my: null, leader: null }
      }
    }),
  )

  const labels: string[] = []
  const mySeries: number[] = []
  const leaderSeries: number[] = []
  const lowerLabels: string[] = []
  const higherLabels: string[] = []
  let comparableCount = 0

  for (const row of rows) {
    labels.push(row.axis.label)
    const [myNormalized, leaderNormalized] = normalizePair(row.my, row.leader)
    mySeries.push(myNormalized)
    leaderSeries.push(leaderNormalized)

    if (
      typeof row.my === 'number' &&
      Number.isFinite(row.my) &&
      typeof row.leader === 'number' &&
      Number.isFinite(row.leader)
    ) {
      comparableCount += 1
      if (row.my < row.leader) lowerLabels.push(row.axis.label)
      if (row.my > row.leader) higherLabels.push(row.axis.label)
    }
  }

  return { labels, mySeries, leaderSeries, lowerLabels, higherLabels, comparableCount }
}

function buildActionGuide(lowerLabels: string[], higherLabels: string[]): string {
  const lower = lowerLabels.join(', ')
  const higher = higherLabels.join(', ')

  if (lowerLabels.length > 0 && higherLabels.length > 0) {
    return [
      `우선 ${lower} 항목을 개선하세요.`,
      `${higher} 항목은 과도하지 않게 유지하세요.`,
      '다음 점검 주기에 같은 지표를 다시 비교해 조정 폭을 확인하세요.',
    ].join('\n')
  }

  if (lowerLabels.length > 0) {
    return [
      `${lower} 항목이 우수 농가보다 낮습니다.`,
      '설정값(관수/환기/차광/영양공급)을 소폭 올린 뒤 재측정하세요.',
    ].join('\n')
  }

  if (higherLabels.length > 0) {
    return [
      `${higher} 항목이 우수 농가보다 높습니다.`,
      '급격히 내리기보다 과도 구간만 단계적으로 완화하세요.',
    ].join('\n')
  }

  return ['우수 농가와 유사한 수준입니다.', '현재 설정을 유지하면서 추세 변동만 모니터링하세요.'].join('\n')
}

export default function CompareScreen() {
  const { isDark } = useTheme()
  const showLeader = useUiPrefsStore((state) => state.showLeader)
  const showMyFarm = useUiPrefsStore((state) => state.showMyFarm)
  const setShowLeader = useUiPrefsStore((state) => state.setShowLeader)
  const setShowMyFarm = useUiPrefsStore((state) => state.setShowMyFarm)

  const { data, isLoading, mutate } = useSWR(['sensor', 'compare-radar'], fetchCompareRadarData, {
    refreshInterval: 65_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const chevronColor = isDark ? '#E0E0E0' : '#1C1C1E'
  const labelColor = isDark ? '#C5C5C5' : '#1C1C1E'
  const gridColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'

  const labels = data?.labels ?? AXES.map((axis) => axis.label)
  const leaderSeries = data?.leaderSeries ?? labels.map(() => 0)
  const mySeries = data?.mySeries ?? labels.map(() => 0)
  const lowerLabels = data?.lowerLabels ?? []
  const higherLabels = data?.higherLabels ?? []
  const comparableCount = data?.comparableCount ?? 0

  const dataSet: number[][] = []
  if (showLeader) dataSet.push(leaderSeries)
  if (showMyFarm) dataSet.push(mySeries)

  const polygonConfigArray: {
    stroke: string
    strokeWidth: number
    fill: string
    showGradient: boolean
    opacity: number
  }[] = []

  if (showLeader) {
    polygonConfigArray.push({
      stroke: ChartColors.seriesGreen,
      strokeWidth: 2,
      fill: 'rgba(184, 212, 200, 0.2)',
      showGradient: false,
      opacity: 1,
    })
  }

  if (showMyFarm) {
    polygonConfigArray.push({
      stroke: ChartColors.seriesBlue,
      strokeWidth: 2,
      fill: 'rgba(122, 182, 217, 0.2)',
      showGradient: false,
      opacity: 1,
    })
  }

  const showChart = dataSet.length > 0
  const analysisText =
    comparableCount === 0 ? '비교할 센서 데이터가 없습니다.' : buildActionGuide(lowerLabels, higherLabels)

  const handleRefetch = async () => {
    await mutate()
  }

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
          onPress={() => router.back()}
          className='mr-3 active:opacity-70'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={chevronColor} strokeWidth={1.5} />
        </Pressable>
        <Text className='font-bold text-title-1 text-content dark:text-content-dark'>{'비교 분석'}</Text>
      </View>

      <ScreenScroll
        className='flex-1'
        onRefetch={handleRefetch}
        contentContainerClassName='pb-24 pt-2'
        contentContainerStyle={IS_ANDROID ? { paddingBottom: AndroidLayout.scrollBottomPadding } : undefined}
      >
        <Text
          className='mx-5 mb-5 font-semibold text-headline text-content dark:text-content-dark'
          style={
            IS_ANDROID
              ? {
                  marginHorizontal: AndroidLayout.paddingHorizontal,
                  marginBottom: AndroidLayout.paddingHorizontal,
                }
              : undefined
          }
        >
          {'분석 차트'}
        </Text>

        <Card className='p-5 mx-5 mb-5' style={IS_ANDROID ? { marginHorizontal: AndroidLayout.paddingHorizontal } : undefined}>
          <View className='items-center'>
            {isLoading && !data ? (
              <View
                style={{ width: CHART_CONTAINER_SIZE, height: CHART_CONTAINER_SIZE }}
                className='items-center justify-center'
              >
                <ScreenLoader fullScreen={false} size='small' />
              </View>
            ) : showChart ? (
              <RadarChart
                dataSet={dataSet}
                labels={labels}
                polygonConfigArray={polygonConfigArray}
                maxValue={100}
                chartSize={CHART_SIZE}
                noOfSections={2}
                startAngle={-90}
                chartContainerProps={{
                  backgroundColor: 'transparent',
                  width: CHART_CONTAINER_SIZE,
                  height: CHART_CONTAINER_SIZE,
                  shiftX: CHART_SHIFT,
                  shiftY: CHART_SHIFT,
                }}
                labelConfig={{
                  stroke: labelColor,
                  fontWeight: '600',
                  fontSize: 14,
                }}
                gridConfig={{
                  stroke: gridColor,
                  strokeWidth: 1,
                  fill: 'none',
                  showGradient: false,
                  opacity: 1,
                }}
                asterLinesConfig={{
                  stroke: gridColor,
                  strokeWidth: 1,
                }}
                labelsPositionOffset={20}
                isAnimated
                animateTogether
              />
            ) : (
              <View
                style={{ width: CHART_CONTAINER_SIZE, height: CHART_CONTAINER_SIZE }}
                className='items-center justify-center'
              >
                <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                  {'표시할 센서 데이터를 선택해 주세요.'}
                </Text>
              </View>
            )}
          </View>

          <View className='flex-row justify-center gap-4 mt-4'>
            <Pressable
              onPress={() => setShowLeader(!showLeader)}
              className='flex-row items-center gap-1.5 p-2'
              style={{ opacity: showLeader ? 1 : 0.4 }}
            >
              <View className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: ChartColors.seriesGreen }} />
              <Text className='font-semibold text-footnote text-content dark:text-content-dark'>{'우수 농가'}</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowMyFarm(!showMyFarm)}
              className='flex-row items-center gap-1.5 p-2'
              style={{ opacity: showMyFarm ? 1 : 0.4 }}
            >
              <View className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: ChartColors.seriesBlue }} />
              <Text className='font-semibold text-footnote text-content dark:text-content-dark'>{'나의 농장'}</Text>
            </Pressable>
          </View>
        </Card>

        <Text
          className='mx-5 mb-4 font-semibold text-headline text-content dark:text-content-dark'
          style={
            IS_ANDROID
              ? {
                  marginHorizontal: AndroidLayout.paddingHorizontal,
                  marginBottom: AndroidLayout.marginBottomBlock,
                }
              : undefined
          }
        >
          {'분석 결과'}
        </Text>

        <Card className='p-6 mx-5 mb-6'>
          <Text className='leading-6 text-body text-content dark:text-content-dark'>{analysisText}</Text>
        </Card>
      </ScreenScroll>
    </SafeAreaView>
  )
}

