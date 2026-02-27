import { Button, Card, DatePicker, ScreenScroll, SectionLabel, Select } from '@/components/ui'
import { ALL_OPTION_VALUE } from '@/constants/marketSearch'
import { useTheme } from '@/hooks/theme'
import { useMarketSearchOptions, useMarketSearchRecords } from '@/hooks/useMarketSearch'
import { validateMarketSearchFilters } from '@/schemas/marketSearch'
import { isNearBottomOnScroll } from '@/shared/scroll'
import { useMarketSearchStore } from '@/store/useMarketSearchStore'
import { formatDisplayDateFromStore, getCellValue, toDateValue } from '@/utils/marketSearch'
import { useFocusEffect } from '@react-navigation/native'
import dayjs from 'dayjs'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type SearchStep = 'item' | 'unit' | 'grade' | 'date' | 'done'
type DateInputStep = 'start' | 'end'
type ConfirmedDateBadges = {
  start: boolean
  end: boolean
}
type CompletedSteps = {
  item: boolean
  unit: boolean
  grade: boolean
  date: boolean
}
type MarketSearchRouteParams = {
  itemCode?: string
  itemName?: string
  gradeName?: string
  unitName?: string
}

const INITIAL_COMPLETED_STEPS: CompletedSteps = {
  item: false,
  unit: false,
  grade: false,
  date: false,
}

const INITIAL_CONFIRMED_DATE_BADGES: ConfirmedDateBadges = {
  start: false,
  end: false,
}
const MIN_SEARCH_START_DATE = 20230101

function getNextStepFromCompletion(steps: CompletedSteps): SearchStep {
  if (!steps.unit) return 'unit'
  if (!steps.grade) return 'grade'
  if (!steps.date) return 'date'
  return 'done'
}

export default function MarketSearchScreen() {
  const routeParams = useLocalSearchParams<MarketSearchRouteParams>()
  const { isDark } = useTheme()
  const chevronColor = isDark ? '#E0E0E0' : '#1C1C1E'
  const startDate = useMarketSearchStore((state) => state.startDate)
  const endDate = useMarketSearchStore((state) => state.endDate)
  const itemCode = useMarketSearchStore((state) => state.itemCode)
  const grade = useMarketSearchStore((state) => state.grade)
  const unitName = useMarketSearchStore((state) => state.unitName)
  const setStartDate = useMarketSearchStore((state) => state.setStartDate)
  const setEndDate = useMarketSearchStore((state) => state.setEndDate)
  const setItemCode = useMarketSearchStore((state) => state.setItemCode)
  const setGrade = useMarketSearchStore((state) => state.setGrade)
  const setUnitName = useMarketSearchStore((state) => state.setUnitName)
  const resetSearch = useMarketSearchStore((state) => state.resetSearch)

  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false)
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false)
  const [activeStep, setActiveStep] = useState<SearchStep>('item')
  const [dateInputStep, setDateInputStep] = useState<DateInputStep>('start')
  const [completedSteps, setCompletedSteps] = useState<CompletedSteps>(INITIAL_COMPLETED_STEPS)
  const [confirmedDateBadges, setConfirmedDateBadges] = useState<ConfirmedDateBadges>(
    INITIAL_CONFIRMED_DATE_BADGES,
  )

  const presetItemCode =
    typeof routeParams.itemCode === 'string' && routeParams.itemCode.length > 0
      ? routeParams.itemCode
      : null
  const presetItemName =
    typeof routeParams.itemName === 'string' && routeParams.itemName.length > 0
      ? routeParams.itemName
      : null
  const presetGradeName =
    typeof routeParams.gradeName === 'string' && routeParams.gradeName.length > 0
      ? routeParams.gradeName
      : null
  const presetUnitName =
    typeof routeParams.unitName === 'string' && routeParams.unitName.length > 0
      ? routeParams.unitName
      : null
  const isPresetFlow = presetItemCode != null && presetGradeName != null && presetUnitName != null

  const { itemOptions, unitOptions, gradeOptions, unitOptionsByItemCode, isOptionLoading } =
    useMarketSearchOptions()
  const {
    records,
    isLoading,
    isLoadingMore,
    hasSearched,
    errorMessage,
    hasMore,
    search,
    loadMore,
    reset,
  } = useMarketSearchRecords()

  const filters = {
    startDate,
    endDate,
    itemCode,
    grade,
    unitName,
  }

  const validationResult = validateMarketSearchFilters(filters)
  const isSearchValid = validationResult.success
  const validationErrorMessage = validationResult.success
    ? null
    : (validationResult.error.issues[0]?.message ?? '검색 조건을 확인해 주세요.')
  const doneButtonMarginClass = validationErrorMessage ? 'mb-3' : 'mb-5'
  const isAllItem = itemCode == null
  const isAllUnit = unitName == null
  const isAllGrade = grade == null
  const selectedItemValue = isAllItem ? ALL_OPTION_VALUE : itemCode
  const baseFilteredUnitOptions =
    itemCode == null ? unitOptions : (unitOptionsByItemCode[itemCode] ?? unitOptions)
  const filteredUnitOptions =
    unitName != null && !baseFilteredUnitOptions.some((option) => option.value === unitName)
      ? [{ label: unitName, value: unitName }, ...baseFilteredUnitOptions]
      : baseFilteredUnitOptions
  const selectedUnitValue = isAllUnit ? ALL_OPTION_VALUE : unitName
  const selectedGradeValue = isAllGrade ? ALL_OPTION_VALUE : grade

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isNearBottomOnScroll(event.nativeEvent)) {
      loadMore().catch(() => undefined)
    }
  }

  // useFocusEffect는 stable callback이 필요해 cleanup을 useCallback으로 고정합니다.
  useFocusEffect(
    useCallback(() => {
      if (isPresetFlow) {
        // [grade]에서 진입 시: 품목/무게/등급 고정, 날짜만 선택
        setItemCode(presetItemCode)
        setGrade(presetGradeName)
        setUnitName(presetUnitName)
        setStartDate(dayjs().subtract(1, 'month').format('YYYYMMDD'))
        setEndDate(dayjs().format('YYYYMMDD'))
        reset()
        setIsStartPickerOpen(false)
        setIsEndPickerOpen(false)
        setActiveStep('date')
        setDateInputStep('start')
        setCompletedSteps({
          item: true,
          unit: true,
          grade: true,
          date: false,
        })
        setConfirmedDateBadges(INITIAL_CONFIRMED_DATE_BADGES)
      } else {
        // 일반 진입 시: 초기 상태
        resetSearch()
        reset()
        setIsStartPickerOpen(false)
        setIsEndPickerOpen(false)
        setActiveStep('item')
        setDateInputStep('start')
        setCompletedSteps(INITIAL_COMPLETED_STEPS)
        setConfirmedDateBadges(INITIAL_CONFIRMED_DATE_BADGES)
      }

      return () => {
        resetSearch()
        reset()
        setIsStartPickerOpen(false)
        setIsEndPickerOpen(false)
        setActiveStep('item')
        setDateInputStep('start')
        setCompletedSteps(INITIAL_COMPLETED_STEPS)
        setConfirmedDateBadges(INITIAL_CONFIRMED_DATE_BADGES)
      }
    }, [
      isPresetFlow,
      presetGradeName,
      presetItemCode,
      presetUnitName,
      resetSearch,
      reset,
      setEndDate,
      setGrade,
      setItemCode,
      setStartDate,
      setUnitName,
    ]),
  )

  const getSelectedLabel = (
    options: { label: string; value: string }[],
    value: string,
    fallbackLabel?: string | null,
  ) => {
    return options.find((option) => option.value === value)?.label ?? fallbackLabel ?? '전체'
  }

  const itemBadge = getSelectedLabel(
    itemOptions,
    selectedItemValue,
    presetItemName ?? presetItemCode,
  )
  const unitBadge = getSelectedLabel(filteredUnitOptions, selectedUnitValue, presetUnitName)
  const gradeBadge = getSelectedLabel(gradeOptions, selectedGradeValue, presetGradeName)
  const startDateBadge = formatDisplayDateFromStore(startDate)
  const endDateBadge = formatDisplayDateFromStore(endDate)

  const handleItemChange = (value: string) => {
    const nextItemCode = value === ALL_OPTION_VALUE ? null : value
    setItemCode(nextItemCode)

    const nextCompleted: CompletedSteps = {
      item: true,
      unit: completedSteps.unit,
      grade: completedSteps.grade,
      date: completedSteps.date,
    }

    setCompletedSteps(nextCompleted)

    const nextStep = getNextStepFromCompletion(nextCompleted)
    setActiveStep(nextStep)
    if (nextStep === 'date') {
      setDateInputStep('start')
    }
  }

  const handleUnitChange = (value: string) => {
    setUnitName(value === ALL_OPTION_VALUE ? null : value)
    const nextCompleted: CompletedSteps = {
      item: true,
      unit: true,
      grade: completedSteps.grade,
      date: completedSteps.date,
    }

    setCompletedSteps(nextCompleted)

    const nextStep = getNextStepFromCompletion(nextCompleted)
    setActiveStep(nextStep)
    if (nextStep === 'date') {
      setDateInputStep('start')
    }
  }

  const handleGradeChange = (value: string) => {
    setGrade(value === ALL_OPTION_VALUE ? null : value)
    const nextCompleted: CompletedSteps = {
      item: completedSteps.item || true,
      unit: completedSteps.unit,
      grade: true,
      date: completedSteps.date,
    }

    setCompletedSteps(nextCompleted)

    const nextStep = getNextStepFromCompletion(nextCompleted)
    setActiveStep(nextStep)
    if (nextStep === 'date') {
      setDateInputStep('start')
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
      <View className='flex-row items-center px-5 py-4 border-b border-border dark:border-border-dark'>
        <Pressable
          onPress={() => router.back()}
          className='mr-3 active:opacity-70'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={chevronColor} strokeWidth={1.5} />
        </Pressable>
        <Text className='font-medium text-title-2 text-content dark:text-content-dark'>
          시세 검색
        </Text>
      </View>

      <ScreenScroll
        className='flex-1'
        contentContainerClassName='px-5 pt-4 pb-24'
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <SectionLabel title='검색 조건' />

        <View className='flex-row flex-wrap gap-2 mb-2'>
          {completedSteps.item ? (
            <Pressable
              onPress={() => {
                if (isPresetFlow) return
                setActiveStep('item')
              }}
              disabled={isPresetFlow}
              className='min-h-[44px] px-4 py-2 rounded-2xl border border-border bg-card dark:border-border-dark dark:bg-card-dark'
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className='font-medium text-body text-content dark:text-content-dark'>
                품목 {itemBadge}
              </Text>
            </Pressable>
          ) : null}
          {completedSteps.unit ? (
            <Pressable
              onPress={() => {
                if (isPresetFlow) return
                setActiveStep('unit')
              }}
              disabled={isPresetFlow}
              className='min-h-[44px] px-4 py-2 rounded-2xl border border-border bg-card dark:border-border-dark dark:bg-card-dark'
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className='font-medium text-body text-content dark:text-content-dark'>
                무게 {unitBadge}
              </Text>
            </Pressable>
          ) : null}
          {completedSteps.grade ? (
            <Pressable
              onPress={() => {
                if (isPresetFlow) return
                setActiveStep('grade')
              }}
              disabled={isPresetFlow}
              className='min-h-[44px] px-4 py-2 rounded-2xl border border-border bg-card dark:border-border-dark dark:bg-card-dark'
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className='font-medium text-body text-content dark:text-content-dark'>
                등급 {gradeBadge}
              </Text>
            </Pressable>
          ) : null}
          {confirmedDateBadges.start ? (
            <Pressable
              onPress={() => {
                setActiveStep('date')
                setDateInputStep('start')
              }}
              className='min-h-[44px] px-4 py-2 rounded-2xl border border-border bg-card dark:border-border-dark dark:bg-card-dark'
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className='font-medium text-body text-content dark:text-content-dark'>
                시작일 {startDateBadge}
              </Text>
            </Pressable>
          ) : null}
          {confirmedDateBadges.end ? (
            <Pressable
              onPress={() => {
                setActiveStep('date')
                setDateInputStep('end')
              }}
              className='min-h-[44px] px-4 py-2 rounded-2xl border border-border bg-card dark:border-border-dark dark:bg-card-dark'
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className='font-medium text-body text-content dark:text-content-dark'>
                종료일 {endDateBadge}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {activeStep !== 'done' ? (
          <Card className='px-5 py-5 mb-5'>
            {activeStep === 'item' && !isPresetFlow ? (
              <>
                <Text className='mb-2 font-medium text-subhead text-content dark:text-content-dark'>
                  품목
                </Text>
                <Select
                  data={itemOptions}
                  value={selectedItemValue}
                  onChange={(item) => handleItemChange(item.value as string)}
                  placeholder='품목을 선택해 주세요'
                  size='lg'
                />
              </>
            ) : null}

            {activeStep === 'unit' && !isPresetFlow ? (
              <>
                <Text className='mb-2 font-medium text-subhead text-content dark:text-content-dark'>
                  무게
                </Text>
                <Select
                  data={filteredUnitOptions}
                  value={selectedUnitValue}
                  onChange={(item) => handleUnitChange(item.value as string)}
                  placeholder='단위를 선택해 주세요'
                  size='lg'
                />
              </>
            ) : null}

            {activeStep === 'grade' && !isPresetFlow ? (
              <>
                <Text className='mb-2 font-medium text-subhead text-content dark:text-content-dark'>
                  등급
                </Text>
                <Select
                  data={gradeOptions}
                  value={selectedGradeValue}
                  onChange={(item) => handleGradeChange(item.value as string)}
                  placeholder='등급을 선택해 주세요'
                  size='lg'
                />
              </>
            ) : null}

            {activeStep === 'date' ? (
              <>
                {dateInputStep === 'start' ? (
                  <>
                    <Text className='mb-2 font-medium text-subhead text-content dark:text-content-dark'>
                      시작일
                    </Text>
                    <Pressable
                      onPress={() => setIsStartPickerOpen(true)}
                      className='h-[52px] justify-center rounded-2xl border border-border px-3 dark:border-border-dark'
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className='text-body text-content dark:text-content-dark'>
                        {formatDisplayDateFromStore(startDate)}
                      </Text>
                    </Pressable>
                  </>
                ) : null}

                {dateInputStep === 'end' ? (
                  <>
                    <Text className='mb-2 font-medium text-subhead text-content dark:text-content-dark'>
                      종료일
                    </Text>
                    <Pressable
                      onPress={() => setIsEndPickerOpen(true)}
                      className='h-[52px] justify-center rounded-2xl border border-border px-3 dark:border-border-dark'
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className='text-body text-content dark:text-content-dark'>
                        {formatDisplayDateFromStore(endDate)}
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </>
            ) : null}
          </Card>
        ) : null}

        {activeStep === 'done' ? (
          <Button
            title='조회하기'
            onPress={() => search(filters, isSearchValid)}
            variant='primary'
            size='lg'
            loading={isLoading}
            disabled={!isSearchValid || isOptionLoading || isLoadingMore}
            className={`${doneButtonMarginClass} rounded-2xl px-6 ${isSearchValid ? '' : 'bg-gray-400 dark:bg-gray-600'}`}
            fullWidth
          />
        ) : null}
        {validationErrorMessage ? (
          <Text className='mb-5 text-subhead text-danger'>{validationErrorMessage}</Text>
        ) : null}

        {hasSearched ? <SectionLabel title='검색 결과' /> : null}

        {hasSearched ? (
          <Card className='overflow-hidden'>
            {errorMessage ? (
              <View className='mx-5 mt-5'>
                <Text className='text-subhead text-danger'>{errorMessage}</Text>
              </View>
            ) : null}

            {isLoading ? (
              <View className='items-center justify-center h-32 bg-card dark:bg-card-dark'>
                <ActivityIndicator size='small' color='#8E8E93' />
              </View>
            ) : records.length === 0 ? (
              <View className='items-center justify-center h-40 px-5'>
                <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                  조회된 데이터가 없습니다.
                </Text>
              </View>
            ) : (
              <View className='bg-card dark:bg-card-dark'>
                {records.map((item, index) => {
                  const priceText = getCellValue(item, 'averagePrice')
                  const priceWithUnit = priceText === '-' ? '-' : `${priceText}원`

                  return (
                    <View
                      key={`${item.id ?? 'id'}-${item.priceDate ?? 'date'}-${item.itemName ?? 'item'}-${index}`}
                      className={`px-5 py-4 ${index < records.length - 1 ? 'border-b border-border dark:border-border-dark' : ''}`}
                    >
                      <View className='flex-row items-center justify-between'>
                        <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                          {getCellValue(item, 'priceDate')}
                        </Text>
                        <Text className='font-semibold text-title-3 text-content dark:text-content-dark'>
                          {priceWithUnit}
                        </Text>
                      </View>

                      <Text
                        className='mt-2 text-subhead text-content dark:text-content-dark'
                        numberOfLines={1}
                      >
                        {getCellValue(item, 'itemName')} · {getCellValue(item, 'gradeName')} ·{' '}
                        {getCellValue(item, 'unitName')}
                      </Text>
                    </View>
                  )
                })}
                {isLoadingMore ? (
                  <View className='items-center justify-center py-4'>
                    <ActivityIndicator size='small' color='#8E8E93' />
                  </View>
                ) : null}
                {!isLoadingMore && records.length > 0 && !hasMore ? (
                  <View className='items-center justify-center px-5 pb-4'>
                    <Text className='text-footnote text-content-tertiary dark:text-content-dark-secondary'>
                      마지막 페이지입니다.
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </Card>
        ) : null}
      </ScreenScroll>

      <DatePicker
        isVisible={isStartPickerOpen}
        mode='date'
        date={toDateValue(startDate, dayjs().subtract(1, 'month').toDate())}
        onConfirm={(nextDate) => {
          const nextStartDate = dayjs(nextDate).format('YYYYMMDD')
          const isInvalidStartDate = Number(nextStartDate) < MIN_SEARCH_START_DATE

          setStartDate(nextStartDate)
          setIsStartPickerOpen(false)

          if (isInvalidStartDate) {
            setConfirmedDateBadges({
              start: false,
              end: false,
            })
            setCompletedSteps((prev) => ({
              item: prev.item,
              unit: prev.unit,
              grade: prev.grade,
              date: false,
            }))
            setActiveStep('date')
            setDateInputStep('start')
            return
          }

          setConfirmedDateBadges({
            start: true,
            end: false,
          })

          if (activeStep === 'date') {
            setCompletedSteps((prev) => ({
              item: prev.item,
              unit: prev.unit,
              grade: prev.grade,
              date: false,
            }))
            setDateInputStep('end')
          }
        }}
        onCancel={() => setIsStartPickerOpen(false)}
      />
      <DatePicker
        isVisible={isEndPickerOpen}
        mode='date'
        date={toDateValue(endDate, new Date())}
        onConfirm={(nextDate) => {
          setEndDate(dayjs(nextDate).format('YYYYMMDD'))
          setConfirmedDateBadges((prev) => ({
            start: prev.start,
            end: true,
          }))
          setIsEndPickerOpen(false)
          if (activeStep === 'date') {
            setCompletedSteps((prev) => ({
              item: prev.item,
              unit: prev.unit,
              grade: prev.grade,
              date: true,
            }))
            setActiveStep('done')
          }
        }}
        onCancel={() => setIsEndPickerOpen(false)}
      />
    </SafeAreaView>
  )
}
