import { AnimatedValueText, Button, Input, ScreenScroll } from '@/components/ui'
import {
  AndroidLayout,
  ChartColors,
  CHART_HEIGHT,
  Colors,
  getCardShadow,
  IS_ANDROID,
} from '@/constants/design'
import { useFarmSensors, useSensorSummary } from '@/hooks/swr'
import type { SensorSummaryData } from '@/hooks/swr/useSensorSummary'
import { useTheme } from '@/hooks/theme'
import { validateSensorThresholdDraft } from '@/schemas/sensorThreshold'
import {
  formatThresholdInput,
  getSensorThresholdRule,
  getThresholdKeyboardType,
  normalizeThresholdTextInput,
} from '@/shared/sensorThreshold'
import { useSensorThresholdStore } from '@/store/useSensorThresholdStore'
import { useUiPrefsStore } from '@/store/uiPrefsStore'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, SlidersHorizontal } from 'lucide-react-native'
import { ActivityIndicator, Dimensions, Modal, PixelRatio, Pressable, Text, View } from 'react-native'
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts/dist/LineChart'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type SummaryPeriod = 'daily' | 'weekly' | 'monthly'

type SensorSummaryPoint = {
  label: string
  avgValue: number
}

type SensorChartData = {
  labels: string[]
  myFarm: number[]
  leadFarm: number[]
}

const SENSOR_INFO: Record<string, { label: string; unit: string }> = {
  temperature: { label: '온도', unit: '°C' },
  humidity: { label: '습도', unit: '%' },
  carbondioxide: { label: 'CO2', unit: 'ppm' },
  insolation: { label: '광량', unit: 'W/m²' },
  ec: { label: 'EC', unit: 'dS/m' },
  hydrogenIon: { label: 'pH', unit: 'pH' },
  soilTemperature: { label: '근권 온도', unit: '°C' },
  soilWater: { label: '근권 습도', unit: '%' },
}

const EMPTY_CHART_DATA: SensorChartData = {
  labels: [],
  myFarm: [],
  leadFarm: [],
}
const EMPTY_UNIT_MAP: Record<string, string> = {}

function buildChartData(
  mySeries: SensorSummaryPoint[],
  leaderSeries: SensorSummaryPoint[],
  sensorType: string,
): SensorChartData {
  const maxLen = Math.max(mySeries.length, leaderSeries.length)
  if (maxLen === 0) return EMPTY_CHART_DATA

  const labels: string[] = []
  const myFarm: number[] = []
  const leadFarm: number[] = []

  for (let i = 0; i < maxLen; i += 1) {
    const my = mySeries[i]
    const leader = leaderSeries[i]
    const label = my?.label ?? leader?.label
    if (!label) continue

    labels.push(label)
    const myValue = my?.avgValue ?? 0
    const leaderValue = leader?.avgValue ?? 0
    myFarm.push(sensorType === 'ec' ? myValue / 1000 : myValue)
    leadFarm.push(sensorType === 'ec' ? leaderValue / 1000 : leaderValue)
  }

  if (labels.length === 0) return EMPTY_CHART_DATA
  return { labels, myFarm, leadFarm }
}

function formatSensorValue(sensorId: string, value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (sensorId === 'carbondioxide' || sensorId === 'insolation') return String(Math.round(value))
  if (sensorId === 'humidity' || sensorId === 'soilWater') return String(Math.round(value))
  if (sensorId === 'ec') return (value / 1000).toFixed(2).replace(/\.?0+$/, '')
  if (sensorId === 'hydrogenIon') return value.toFixed(1)
  return value.toFixed(1)
}

function normalizeSensorType(type: string): string {
  const normalized = type.trim().toLowerCase()
  if (normalized === 'carbondioxide' || normalized === 'carbon_dioxide' || normalized === 'co2') {
    return 'carbondioxide'
  }
  return type
}

function SensorLineChart({
  data,
  isDark,
  unit,
}: {
  data: SensorChartData
  isDark: boolean
  unit: string
}) {
  if (data.labels.length === 0) {
    return (
      <View style={{ height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size='small' color={isDark ? '#E5E5EA' : '#636366'} />
      </View>
    )
  }

  const chartWidth = Math.max(SCREEN_WIDTH - 88, 220)
  const decimals = unit === 'dS/m' ? 2 : 0
  const lastIndex = data.labels.length - 1
  const isDaily = data.labels.every((label) => label.includes(':'))
  const isWeekly = data.labels.length === 7

  const shouldShowLabel = (i: number): boolean => {
    if (isWeekly) return true
    if (isDaily) {
      if (data.labels.length >= 16) return i % 4 === 0
      return i % 2 === 0
    }
    const step = Math.max(1, Math.round(lastIndex / 4))
    return i % step === 0
  }

  const yLabelW = 35
  const startPad = 10
  const endPad = 14
  const plotWidth = chartWidth - yLabelW - startPad - endPad
  const pointSpacing = plotWidth / (lastIndex || 1)
  const labelWidth = Math.max(pointSpacing, 40)

  const fontScale = IS_ANDROID ? PixelRatio.getFontScale() : 1
  const chartLabelFontSize = 10 / fontScale

  const myFarmData = data.myFarm.map((v, i) => ({
    value: v,
    label: shouldShowLabel(i) ? data.labels[i] : '',
    labelTextStyle: {
      color: '#8E8E93',
      fontSize: chartLabelFontSize,
      width: labelWidth,
      textAlign: 'center' as const,
    },
    hideDataPoint: i !== lastIndex,
  }))

  const leadFarmData = data.leadFarm.map((v, i) => ({
    value: v,
    hideDataPoint: i !== lastIndex,
  }))

  const allValues = [...data.myFarm, ...data.leadFarm].filter((value) => Number.isFinite(value))
  if (allValues.length === 0) {
    return (
      <View style={{ height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size='small' color={isDark ? '#E5E5EA' : '#636366'} />
      </View>
    )
  }

  const dataMin = Math.min(...allValues)
  const dataMax = Math.max(...allValues)
  const range = dataMax - dataMin
  const padding = Math.max(range * 0.3, 1)
  const minValue = Math.floor(dataMin - padding)
  const maxValue = Math.ceil(dataMax + padding)

  return (
    <View
      style={{
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <GiftedLineChart
        data={myFarmData}
        data2={leadFarmData.length > 0 ? leadFarmData : undefined}
        width={chartWidth}
        height={CHART_HEIGHT}
        spacing={pointSpacing}
        color1={ChartColors.seriesBlue}
        color2={ChartColors.seriesGreen}
        thickness={2.5}
        thickness2={2}
        dataPointsRadius={5}
        dataPointsColor1={ChartColors.seriesBlue}
        dataPointsColor2={ChartColors.seriesGreen}
        curved
        curvature={0.15}
        yAxisColor='transparent'
        xAxisColor={isDark ? '#48484A' : '#E5E5EA'}
        yAxisTextStyle={{ color: '#8E8E93', fontSize: chartLabelFontSize }}
        xAxisLabelTextStyle={{
          color: '#8E8E93',
          fontSize: chartLabelFontSize,
          width: labelWidth,
          textAlign: 'center',
        }}
        noOfSections={4}
        maxValue={maxValue - minValue}
        yAxisOffset={minValue}
        formatYLabel={(label: string) => parseFloat(label).toFixed(decimals)}
        rulesColor={isDark ? '#48484A' : '#E5E5EA'}
        rulesType='solid'
        initialSpacing={startPad}
        endSpacing={endPad}
        disableScroll
        isAnimated
        animationDuration={500}
        yAxisLabelWidth={yLabelW}
        pointerConfig={{
          showPointerStrip: true,
          activatePointersOnLongPress: false,
          activatePointersInstantlyOnTouch: true,
          pointerStripColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
          pointerColor: isDark ? '#FFFFFF' : '#1C1C1E',
          pointer1Color: isDark ? '#FFFFFF' : '#1C1C1E',
          pointer2Color: isDark ? '#FFFFFF' : '#1C1C1E',
          pointerLabelWidth: 170,
          pointerLabelHeight: 84,
          shiftPointerLabelY: 84,
          pointerLabelComponent: (
            items: { value?: number; label?: string } | { value?: number; label?: string }[],
          ) => {
            const list = Array.isArray(items) ? items : [items]
            const names = ['나의 농가', '우수 농가']
            const rows = list.filter((item) => item?.value != null)
            if (rows.length === 0) return null

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
                {rows.map((item, i) => (
                  <Text
                    key={i}
                    className='font-semibold text-caption-1 text-content dark:text-content-dark'
                    allowFontScaling={false}
                    style={{ fontSize: 15, lineHeight: 20 }}
                  >
                    {rows.length > 1 ? `${names[i] ?? ''}: ` : ''}
                    {item.value!.toFixed(decimals)}
                    {unit ? ` ${unit}` : ''}
                  </Text>
                ))}
              </View>
            )
          },
        }}
      />
    </View>
  )
}

export default function SensorDetailScreen() {
  const { isDark } = useTheme()
  const { id, type } = useLocalSearchParams<{ id?: string; type?: string }>()
  const selectedPeriod = useUiPrefsStore((state) => state.selectedSensorPeriod)
  const setSelectedPeriod = useUiPrefsStore((state) => state.setSelectedSensorPeriod)
  const sensorThresholds = useSensorThresholdStore((state) => state.sensorThresholds)
  const modalState = useSensorThresholdStore((state) => state.modal)
  const openEditorModal = useSensorThresholdStore((state) => state.openEditorModal)
  const closeEditorModal = useSensorThresholdStore((state) => state.closeEditorModal)
  const openConfirmStep = useSensorThresholdStore((state) => state.openConfirmStep)
  const closeConfirmStep = useSensorThresholdStore((state) => state.closeConfirmStep)
  const setDraftMinInput = useSensorThresholdStore((state) => state.setDraftMinInput)
  const setDraftMaxInput = useSensorThresholdStore((state) => state.setDraftMaxInput)
  const setModalErrorMessage = useSensorThresholdStore((state) => state.setModalErrorMessage)
  const confirmSaveThreshold = useSensorThresholdStore((state) => state.confirmSaveThreshold)

  const resolvedType = Array.isArray(type) ? type[0] : type
  const resolvedId = Array.isArray(id) ? id[0] : id
  const sensorType = normalizeSensorType(
    (typeof resolvedType === 'string' && resolvedType) ||
      (typeof resolvedId === 'string' && resolvedId) ||
      'temperature',
  )
  const sensorInfo = SENSOR_INFO[sensorType] ?? SENSOR_INFO.temperature

  const { data: farmSensorsData, mutate: revalidateFarmSensors } = useFarmSensors()
  const { data: summaryData, mutate: revalidateSummary } = useSensorSummary(sensorType)

  const currentUnits = farmSensorsData?.currentUnits ?? EMPTY_UNIT_MAP

  const summary: SensorSummaryData = summaryData ?? {
    my: { daily: [], weekly: [], monthly: [] },
    leader: { daily: [], weekly: [], monthly: [] },
  }

  const mySeries = summary.my[selectedPeriod]
  const leaderSeries = summary.leader[selectedPeriod]
  const chartData = buildChartData(mySeries, leaderSeries, sensorType)

  const sensorUnit = sensorType === 'ec' ? 'dS/m' : (currentUnits[sensorType] ?? sensorInfo.unit)
  const thresholdRule = getSensorThresholdRule(sensorType)
  const thresholdKeyboardType = getThresholdKeyboardType(sensorType)
  const appliedThreshold = sensorThresholds[sensorType]
  const appliedThresholdMin = appliedThreshold?.min
  const appliedThresholdMax = appliedThreshold?.max
  const createThresholdForm = () => {
    return {
      minInput:
        appliedThresholdMin == null
          ? ''
          : formatThresholdInput(appliedThresholdMin, thresholdRule.decimals),
      maxInput:
        appliedThresholdMax == null
          ? ''
          : formatThresholdInput(appliedThresholdMax, thresholdRule.decimals),
    }
  }
  const thresholdDraft = modalState.draft
  const thresholdErrorMessage = modalState.errorMessage
  const isThresholdModalVisible = modalState.isEditorModalVisible
  const isConfirmStepVisible = modalState.isConfirmStepVisible
  const currentThresholdLabel = (() => {
    if (!appliedThreshold || (appliedThreshold.min == null && appliedThreshold.max == null)) {
      return '미설정'
    }

    const minLabel =
      appliedThreshold.min == null
        ? '미설정'
        : formatThresholdInput(appliedThreshold.min, thresholdRule.decimals)
    const maxLabel =
      appliedThreshold.max == null
        ? '미설정'
        : formatThresholdInput(appliedThreshold.max, thresholdRule.decimals)
    return `최소 ${minLabel} / 최대 ${maxLabel} ${sensorUnit}`
  })()

  const dailyMySeries = summary.my.daily
  const latestMy = dailyMySeries[dailyMySeries.length - 1]?.avgValue
  const currentMyFarm =
    typeof latestMy === 'number' && Number.isFinite(latestMy)
      ? latestMy
      : (mySeries[mySeries.length - 1]?.avgValue ?? 0)

  const currentLeaderFarm = (() => {
    const dailyLeaderSeries = summary.leader.daily
    const latestLeader = dailyLeaderSeries[dailyLeaderSeries.length - 1]?.avgValue
    if (typeof latestLeader === 'number' && Number.isFinite(latestLeader)) return latestLeader
    const fallback = leaderSeries[leaderSeries.length - 1]?.avgValue
    return fallback ?? 0
  })()

  const displayDiff =
    sensorType === 'ec'
      ? Math.abs(currentMyFarm - currentLeaderFarm) / 1000
      : Math.abs(currentMyFarm - currentLeaderFarm)

  const handleRefetch = async () => {
    await Promise.all([revalidateFarmSensors(), revalidateSummary()])
  }

  const handleRequestSaveThreshold = () => {
    const result = validateSensorThresholdDraft(
      {
        minInput: thresholdDraft.minInput,
        maxInput: thresholdDraft.maxInput,
      },
      {
        integerOnly: thresholdRule.integerOnly,
        decimals: thresholdRule.decimals,
      },
    )

    if (!result.value || result.errorMessage) {
      setModalErrorMessage(result.errorMessage ?? '입력값을 확인해 주세요.')
      return
    }

    openConfirmStep(result.value)
  }

  const handleConfirmSaveThreshold = () => {
    confirmSaveThreshold()
  }

  const handleCancelConfirmStep = () => {
    closeConfirmStep()
  }

  const periods: { id: SummaryPeriod; label: string }[] = [
    { id: 'daily', label: '1일' },
    { id: 'weekly', label: '1주일' },
    { id: 'monthly', label: '1개월' },
  ]

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
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
          onPress={() => router.replace('/(tabs)/home')}
          className='mr-3'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <ChevronLeft size={24} color={isDark ? '#E0E0E0' : '#1C1C1E'} strokeWidth={1.5} />
        </Pressable>
        <Text className='flex-1 font-bold text-title-1 text-content dark:text-content-dark'>
          {sensorInfo.label}
        </Text>
        <Pressable
          onPress={() => {
            openEditorModal(sensorType, createThresholdForm())
          }}
          className='ml-3 h-9 w-9 items-center justify-center rounded-full border border-border bg-card dark:border-border-dark dark:bg-card-dark'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <SlidersHorizontal size={18} color={isDark ? '#E0E0E0' : '#1C1C1E'} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScreenScroll
        className='flex-1'
        onRefetch={handleRefetch}
        contentContainerClassName='px-5 pb-24'
        contentContainerStyle={
          IS_ANDROID
            ? {
                paddingHorizontal: AndroidLayout.paddingHorizontal,
                paddingBottom: AndroidLayout.scrollBottomPadding,
              }
            : undefined
        }
      >
        <View
          className='flex-row items-center justify-center gap-3 py-4'
          style={IS_ANDROID ? { gap: AndroidLayout.gap, paddingVertical: 14 } : undefined}
        >
          {periods.map(({ id: periodId, label }) => {
            const isSelected = selectedPeriod === periodId
            const colors = isDark ? Colors.dark : Colors.light
            const pillBg = isSelected ? 'bg-white dark:bg-white' : 'bg-card dark:bg-card-dark'
            const pillText = isSelected
              ? 'text-subhead font-medium text-content dark:text-[#1C1C1E]'
              : 'text-subhead text-content-secondary dark:text-content-dark-secondary'

            return (
              <Pressable
                key={periodId}
                onPress={() => setSelectedPeriod(periodId)}
                className={`flex-1 min-h-[44px] py-3 rounded-2xl items-center justify-center border border-border dark:border-border-dark ${pillBg} active:opacity-70`}
                style={[
                  getCardShadow(isDark),
                  isSelected && {
                    backgroundColor: colors.segmentedSelectedBg,
                    borderColor: colors.segmentedSelectedBg,
                  },
                ]}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text
                  className={isSelected ? 'text-subhead font-medium' : pillText}
                  style={isSelected ? { color: colors.segmentedSelectedText } : undefined}
                >
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View
          className='flex-row gap-3 mt-2'
          style={IS_ANDROID ? { gap: AndroidLayout.gap, marginTop: 8 } : undefined}
        >
          <View
            className='flex-1 p-4 bg-card dark:bg-card-dark rounded-2xl'
            style={[
              {
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(56,56,58,0.8)' : 'rgba(0,0,0,0.1)',
                ...getCardShadow(isDark),
              },
              IS_ANDROID && { padding: AndroidLayout.cardPadding },
            ]}
          >
            <View className='flex-row items-center mb-2'>
              <View
                className='w-3 h-3 mr-2 rounded-full'
                style={{ backgroundColor: ChartColors.seriesBlue }}
              />
              <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                나의 농가
              </Text>
            </View>
            <View className='flex-row items-end'>
              <AnimatedValueText
                value={currentMyFarm}
                className='font-semibold text-value-lg text-content dark:text-content-dark'
                format={(value) => formatSensorValue(sensorType, value)}
                duration={650}
              />
              <Text className='ml-1 text-body text-content-secondary dark:text-content-dark-secondary'>
                {sensorUnit}
              </Text>
            </View>
          </View>

          <View
            className='flex-1 p-4 bg-card dark:bg-card-dark rounded-2xl'
            style={[
              {
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(56,56,58,0.8)' : 'rgba(0,0,0,0.1)',
                ...getCardShadow(isDark),
              },
              IS_ANDROID && { padding: AndroidLayout.cardPadding },
            ]}
          >
            <View className='flex-row items-center mb-2'>
              <View
                className='w-3 h-3 mr-2 rounded-full'
                style={{ backgroundColor: ChartColors.seriesGreen }}
              />
              <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                우수 농가
              </Text>
            </View>
            <View className='flex-row items-end'>
              <AnimatedValueText
                value={currentLeaderFarm}
                className='font-semibold text-value-lg text-content dark:text-content-dark'
                format={(value) => formatSensorValue(sensorType, value)}
                duration={650}
              />
              <Text className='ml-1 text-body text-content-secondary dark:text-content-dark-secondary'>
                {sensorUnit}
              </Text>
            </View>
          </View>
        </View>

        <Text
          className='mt-4 mb-2 font-medium text-headline text-content dark:text-content-dark'
          style={IS_ANDROID ? { marginTop: 14, marginBottom: 8 } : undefined}
        >
          {sensorInfo.label} 추이
        </Text>
        <View
          className='p-5 bg-card dark:bg-card-dark rounded-2xl'
          style={[
            {
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(56,56,58,0.8)' : 'rgba(0,0,0,0.1)',
              ...getCardShadow(isDark),
            },
            IS_ANDROID && { padding: AndroidLayout.cardPadding },
          ]}
        >
          <SensorLineChart data={chartData} isDark={isDark} unit={sensorUnit} />

          <View className='flex-row justify-center gap-6 pt-4 mt-4 border-t border-border dark:border-border-dark'>
            <View className='flex-row items-center'>
              <View
                className='w-4 h-0.5 mr-2'
                style={{ backgroundColor: ChartColors.seriesBlue }}
              />
              <Text className='text-caption-1 text-content dark:text-content-dark'>나의 농가</Text>
            </View>
            <View className='flex-row items-center'>
              <View
                className='w-4 h-0.5 mr-2'
                style={{ backgroundColor: ChartColors.seriesGreen }}
              />
              <Text className='text-caption-1 text-content dark:text-content-dark'>우수 농가</Text>
            </View>
          </View>
        </View>

        <Text className='mt-4 mb-2 font-medium text-headline text-content dark:text-content-dark'>
          비교 분석
        </Text>
        <View
          className='p-5 bg-card dark:bg-card-dark rounded-2xl'
          style={{
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(56,56,58,0.6)' : 'rgba(0,0,0,0.06)',
            ...getCardShadow(isDark),
          }}
        >
          <View className='gap-2'>
            {currentMyFarm > currentLeaderFarm ? (
              <Text className='text-body text-content dark:text-content-dark'>
                나의 농가가 우수 농가보다{' '}
                <Text className='font-medium' style={{ color: ChartColors.up }}>
                  {displayDiff.toFixed(sensorType === 'ec' ? 2 : 1)} {sensorUnit}
                </Text>{' '}
                높습니다
              </Text>
            ) : (
              <Text className='text-body text-content dark:text-content-dark'>
                나의 농가가 우수 농가보다{' '}
                <Text className='font-medium' style={{ color: ChartColors.down }}>
                  {displayDiff.toFixed(sensorType === 'ec' ? 2 : 1)} {sensorUnit}
                </Text>{' '}
                낮습니다
              </Text>
            )}
          </View>
        </View>
      </ScreenScroll>

      <Modal
        visible={isThresholdModalVisible}
        transparent
        animationType='fade'
        onRequestClose={closeEditorModal}
      >
        <View className='flex-1 items-center justify-center bg-black/45 px-5'>
          <View className='w-full rounded-2xl border border-border bg-card px-4 pb-4 pt-5 dark:border-border-dark dark:bg-card-dark'>
            {isConfirmStepVisible ? (
              <>
                <Text className='font-semibold text-title-3 text-content dark:text-content-dark'>
                  임계치 저장
                </Text>
                <Text className='mt-2 text-subhead text-content-secondary dark:text-content-dark-secondary'>
                  입력한 임계치 설정을 저장하시겠습니까?
                </Text>
                <View className='mt-4 flex-row gap-2'>
                  <Button
                    title='취소'
                    variant='secondary'
                    size='md'
                    className='flex-1 rounded-2xl'
                    onPress={handleCancelConfirmStep}
                  />
                  <Button
                    title='완료'
                    size='md'
                    className='flex-1 rounded-2xl'
                    onPress={handleConfirmSaveThreshold}
                  />
                </View>
              </>
            ) : (
              <>
                <Text className='font-semibold text-title-3 text-content dark:text-content-dark'>
                  {sensorInfo.label} 임계치 설정
                </Text>
                <Text className='mt-2 text-subhead text-content-secondary dark:text-content-dark-secondary'>
                  현재 설정: {currentThresholdLabel}
                </Text>

                <View className='mt-4 gap-3'>
                  <Input
                    label={`최소값 (${sensorUnit})`}
                    value={thresholdDraft.minInput}
                    onChangeText={(value) => {
                      const nextValue = normalizeThresholdTextInput(value, thresholdRule.integerOnly)
                      setDraftMinInput(nextValue)
                    }}
                    keyboardType={thresholdKeyboardType}
                    placeholder='최소값 입력'
                    textAlign='right'
                    maxLength={10}
                  />

                  <Input
                    label={`최대값 (${sensorUnit})`}
                    value={thresholdDraft.maxInput}
                    onChangeText={(value) => {
                      const nextValue = normalizeThresholdTextInput(value, thresholdRule.integerOnly)
                      setDraftMaxInput(nextValue)
                    }}
                    keyboardType={thresholdKeyboardType}
                    placeholder='최대값 입력'
                    textAlign='right'
                    maxLength={10}
                  />
                </View>

                {thresholdErrorMessage ? (
                  <Text className='mt-3 text-footnote text-danger'>{thresholdErrorMessage}</Text>
                ) : null}

                <View className='mt-4 flex-row gap-2'>
                  <Button
                    title='취소'
                    variant='secondary'
                    size='md'
                    className='flex-1 rounded-2xl'
                    onPress={closeEditorModal}
                  />
                  <Button
                    title='저장'
                    size='md'
                    className='flex-1 rounded-2xl'
                    onPress={handleRequestSaveThreshold}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
