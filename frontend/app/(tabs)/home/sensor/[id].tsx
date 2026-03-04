import { SensorLineChart } from '@/components/sensor-detail/SensorLineChart'
import { SensorThresholdModal } from '@/components/sensor-detail/SensorThresholdModal'
import { AnimatedValueText, ScreenScroll } from '@/components/ui'
import { AndroidLayout, ChartColors, Colors, getCardShadow, IS_ANDROID } from '@/constants/design'
import { useFarmSensors, useSensorSummary } from '@/hooks/swr'
import type { SensorSummaryData } from '@/hooks/swr/useSensorSummary'
import { useTheme } from '@/hooks/theme'
import { validateSensorThresholdDraft } from '@/schemas/sensorThreshold'
import {
  buildSensorChartData,
  EMPTY_SENSOR_UNIT_MAP,
  formatSensorValue,
  normalizeSensorType,
  type SummaryPeriod,
} from '@/shared/sensorDetail'
import {
  formatThresholdInput,
  getSensorThresholdUiAction,
  getSensorThresholdRule,
  getThresholdKeyboardType,
  normalizeThresholdTextInput,
} from '@/shared/sensorThreshold'
import { useSensorThresholdStore } from '@/store/useSensorThresholdStore'
import { useUiPrefsStore } from '@/store/uiPrefsStore'
import type { SensorInfo } from '@/types/pages'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, SlidersHorizontal } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SENSOR_INFO: Record<string, SensorInfo> = {
  temperature: { label: '온도', unit: '℃' },
  humidity: { label: '습도', unit: '%' },
  carbondioxide: { label: 'CO2', unit: 'ppm' },
  insolation: { label: '광량', unit: 'W/m²' },
  ec: { label: 'EC', unit: 'dS/m' },
  hydrogenIon: { label: 'pH', unit: 'pH' },
  soilTemperature: { label: '근권 온도', unit: '℃' },
  soilWater: { label: '근권 습도', unit: '%' },
}

const PERIOD_OPTIONS: { id: SummaryPeriod; label: string }[] = [
  { id: 'daily', label: '1일' },
  { id: 'weekly', label: '1주일' },
  { id: 'monthly', label: '1개월' },
]

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

  const currentUnits = farmSensorsData?.currentUnits ?? EMPTY_SENSOR_UNIT_MAP

  const summary: SensorSummaryData = summaryData ?? {
    my: { daily: [], weekly: [], monthly: [] },
    leader: { daily: [], weekly: [], monthly: [] },
  }

  const mySeries = summary.my[selectedPeriod]
  const leaderSeries = summary.leader[selectedPeriod]
  const chartData = buildSensorChartData(mySeries, leaderSeries, sensorType)

  const sensorUnit = sensorType === 'ec' ? 'dS/m' : (currentUnits[sensorType] ?? sensorInfo.unit)
  const thresholdRule = getSensorThresholdRule(sensorType)
  const thresholdKeyboardType = getThresholdKeyboardType(sensorType)

  const appliedThreshold = sensorThresholds[sensorType]
  const appliedThresholdMin = appliedThreshold?.min
  const appliedThresholdMax = appliedThreshold?.max

  const createThresholdForm = () => ({
    minInput:
      appliedThresholdMin == null
        ? ''
        : formatThresholdInput(appliedThresholdMin, thresholdRule.decimals),
    maxInput:
      appliedThresholdMax == null
        ? ''
        : formatThresholdInput(appliedThresholdMax, thresholdRule.decimals),
  })

  const thresholdDraft = modalState.draft
  const thresholdErrorMessage = modalState.errorMessage
  const isThresholdModalVisible = modalState.isEditorModalVisible
  const isConfirmStepVisible = modalState.isConfirmStepVisible
  const isSavingThreshold = modalState.isSaving
  const pendingThresholdValue = modalState.pendingValue

  const hasAppliedThreshold = appliedThreshold?.min != null || appliedThreshold?.max != null
  const hasDraftValue =
    thresholdDraft.minInput.trim().length > 0 || thresholdDraft.maxInput.trim().length > 0

  const draftValidationResult = validateSensorThresholdDraft(
    {
      minInput: thresholdDraft.minInput,
      maxInput: thresholdDraft.maxInput,
    },
    {
      integerOnly: thresholdRule.integerOnly,
      decimals: thresholdRule.decimals,
    },
  )

  const editActionType = (() => {
    if (!hasDraftValue) return 'none'
    if (!draftValidationResult.value) return hasAppliedThreshold ? 'update' : 'create'

    const nextAction = getSensorThresholdUiAction(appliedThreshold, draftValidationResult.value)
    if (nextAction === 'none' || nextAction === 'reset') return 'none'
    return nextAction
  })()

  const editActionButtonLabel =
    editActionType === 'create' ? '추가' : editActionType === 'update' ? '수정' : '변경 없음'
  const isEditActionDisabled = editActionType === 'none' || isSavingThreshold

  const confirmActionType = getSensorThresholdUiAction(appliedThreshold, pendingThresholdValue)
  const confirmActionTitle =
    confirmActionType === 'create'
      ? '임계치 추가'
      : confirmActionType === 'update'
        ? '임계치 수정'
        : confirmActionType === 'reset'
          ? '임계치 초기화'
          : '임계치 저장'

  const confirmActionMessage =
    confirmActionType === 'create'
      ? '입력한 임계치 설정을 추가하시겠습니까?'
      : confirmActionType === 'update'
        ? '변경한 임계치 설정을 수정하시겠습니까?'
        : confirmActionType === 'reset'
          ? '설정한 임계치를 초기화하시겠습니까?'
          : '변경된 임계치가 없습니다.'

  const confirmActionButtonLabel =
    confirmActionType === 'create'
      ? '추가'
      : confirmActionType === 'update'
        ? '수정'
        : confirmActionType === 'reset'
          ? '초기화'
          : '완료'

  const confirmMinValueLabel =
    pendingThresholdValue?.min == null
      ? '미설정'
      : `${formatThresholdInput(pendingThresholdValue.min, thresholdRule.decimals)} ${sensorUnit}`

  const confirmMaxValueLabel =
    pendingThresholdValue?.max == null
      ? '미설정'
      : `${formatThresholdInput(pendingThresholdValue.max, thresholdRule.decimals)} ${sensorUnit}`

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

    const nextActionType = getSensorThresholdUiAction(appliedThreshold, result.value)
    if (nextActionType === 'none') {
      setModalErrorMessage('변경된 임계치가 없습니다.')
      return
    }

    openConfirmStep(result.value)
  }

  const handleConfirmSaveThreshold = async () => {
    await confirmSaveThreshold()
  }

  const handleCancelConfirmStep = () => {
    closeConfirmStep()
  }

  const handleRequestResetThreshold = () => {
    if (!appliedThreshold) return
    setModalErrorMessage(null)
    openConfirmStep({ min: null, max: null })
  }

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
      <View
        className='flex-row items-center border-b border-border px-5 py-4 dark:border-border-dark'
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
          {PERIOD_OPTIONS.map(({ id: periodId, label }) => {
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
                className={`flex-1 min-h-[44px] items-center justify-center rounded-2xl border border-border py-3 dark:border-border-dark ${pillBg} active:opacity-70`}
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
          className='mt-2 flex-row gap-3'
          style={IS_ANDROID ? { gap: AndroidLayout.gap, marginTop: 8 } : undefined}
        >
          <View
            className='flex-1 rounded-2xl bg-card p-4 dark:bg-card-dark'
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
            <View className='mb-2 flex-row items-center'>
              <View
                className='mr-2 h-3 w-3 rounded-full'
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
            className='flex-1 rounded-2xl bg-card p-4 dark:bg-card-dark'
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
            <View className='mb-2 flex-row items-center'>
              <View
                className='mr-2 h-3 w-3 rounded-full'
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
          className='mb-2 mt-4 font-medium text-headline text-content dark:text-content-dark'
          style={IS_ANDROID ? { marginTop: 14, marginBottom: 8 } : undefined}
        >
          {sensorInfo.label} 추이
        </Text>

        <View
          className='rounded-2xl bg-card p-5 dark:bg-card-dark'
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

          <View className='mt-4 flex-row justify-center gap-6 border-t border-border pt-4 dark:border-border-dark'>
            <View className='flex-row items-center'>
              <View className='mr-2 h-0.5 w-4' style={{ backgroundColor: ChartColors.seriesBlue }} />
              <Text className='text-caption-1 text-content dark:text-content-dark'>나의 농가</Text>
            </View>
            <View className='flex-row items-center'>
              <View
                className='mr-2 h-0.5 w-4'
                style={{ backgroundColor: ChartColors.seriesGreen }}
              />
              <Text className='text-caption-1 text-content dark:text-content-dark'>우수 농가</Text>
            </View>
          </View>
        </View>

        <Text className='mb-2 mt-4 font-medium text-headline text-content dark:text-content-dark'>
          비교 분석
        </Text>

        <View
          className='rounded-2xl bg-card p-5 dark:bg-card-dark'
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

      <SensorThresholdModal
        visible={isThresholdModalVisible}
        isDark={isDark}
        isConfirmStepVisible={isConfirmStepVisible}
        isSaving={isSavingThreshold}
        sensorInfo={sensorInfo}
        sensorUnit={sensorUnit}
        thresholdDraft={thresholdDraft}
        thresholdErrorMessage={thresholdErrorMessage}
        thresholdKeyboardType={thresholdKeyboardType}
        currentThresholdLabel={currentThresholdLabel}
        appliedThreshold={appliedThreshold}
        confirmActionType={confirmActionType}
        confirmActionTitle={confirmActionTitle}
        confirmActionMessage={confirmActionMessage}
        confirmActionButtonLabel={confirmActionButtonLabel}
        confirmMinValueLabel={confirmMinValueLabel}
        confirmMaxValueLabel={confirmMaxValueLabel}
        editActionButtonLabel={editActionButtonLabel}
        isEditActionDisabled={isEditActionDisabled}
        onClose={closeEditorModal}
        onCancelConfirmStep={handleCancelConfirmStep}
        onConfirmSaveThreshold={handleConfirmSaveThreshold}
        onRequestSaveThreshold={handleRequestSaveThreshold}
        onRequestResetThreshold={handleRequestResetThreshold}
        onChangeMinInput={(value) => {
          const nextValue = normalizeThresholdTextInput(value, thresholdRule.integerOnly)
          setDraftMinInput(nextValue)
        }}
        onChangeMaxInput={(value) => {
          const nextValue = normalizeThresholdTextInput(value, thresholdRule.integerOnly)
          setDraftMaxInput(nextValue)
        }}
      />
    </SafeAreaView>
  )
}
