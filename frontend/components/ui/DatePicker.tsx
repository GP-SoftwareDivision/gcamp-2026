import {
  buildDayOptions,
  clampDayPart,
  createDatePickerParts,
  getMaxDayFromParts,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  type DatePickerParts,
} from '@/shared/datePicker'
import { useEffect, useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { Select } from './Select'

type DatePickerMode = 'date' | 'time'

type DatePickerProps = {
  // DatePicker 모달 표시 여부
  isVisible: boolean
  // 선택 모드 (date 또는 time)
  mode: DatePickerMode
  // 현재 선택된 날짜/시간 값
  date: Date
  // 확인 버튼 클릭 시 선택된 Date 반환
  onConfirm: (date: Date) => void
  // 취소 버튼 클릭 시 호출
  onCancel: () => void
}

type SelectOption = {
  label: string
  value: string
}

// 공통 DatePicker 래퍼 컴포넌트
// 사용 예: <DatePicker isVisible={open} mode="date" date={value} onConfirm={...} onCancel={...} />
export function DatePicker({ isVisible, mode, date, onConfirm, onCancel }: DatePickerProps) {
  const [parts, setParts] = useState<DatePickerParts>(() => createDatePickerParts(date))
  const maxDay = getMaxDayFromParts(parts.year, parts.month)
  const dayOptions: SelectOption[] = buildDayOptions(maxDay)

  useEffect(() => {
    if (!isVisible) return
    setParts(createDatePickerParts(date))
  }, [date, isVisible])

  useEffect(() => {
    const clampedDay = clampDayPart(parts.day, maxDay)
    if (clampedDay === parts.day) return
    setParts((prev) => ({
      ...prev,
      day: clampedDay,
    }))
  }, [parts.day, maxDay])

  const handleConfirm = () => {
    const baseYear = Number(parts.year)
    const baseMonth = Number(parts.month)
    const baseDay = Number(parts.day)
    const baseHour = Number(parts.hour)
    const baseMinute = Number(parts.minute)

    if (mode === 'time') {
      const nextTime = new Date(date)
      nextTime.setHours(Number.isFinite(baseHour) ? baseHour : date.getHours())
      nextTime.setMinutes(Number.isFinite(baseMinute) ? baseMinute : date.getMinutes())
      nextTime.setSeconds(0)
      nextTime.setMilliseconds(0)
      onConfirm(nextTime)
      return
    }

    const safeYear = Number.isFinite(baseYear) ? baseYear : date.getFullYear()
    const safeMonth = Number.isFinite(baseMonth) ? baseMonth : date.getMonth() + 1
    const safeDay = Number.isFinite(baseDay) ? baseDay : date.getDate()
    const nextDate = new Date(safeYear, safeMonth - 1, safeDay)
    onConfirm(nextDate)
  }

  return (
    <Modal visible={isVisible} transparent animationType='fade' onRequestClose={onCancel}>
      <View className='flex-1 items-center justify-center bg-black/45 px-5'>
        <View className='w-full rounded-2xl border border-border bg-card px-4 pb-4 pt-5 dark:border-border-dark dark:bg-card-dark'>
          {mode === 'time' ? (
            <View className='flex-row gap-2'>
              <View className='flex-1'>
                <Select
                  data={HOUR_OPTIONS}
                  value={parts.hour}
                  onChange={(item) =>
                    setParts((prev) => ({
                      ...prev,
                      hour: String(item.value),
                    }))
                  }
                  placeholder='시'
                  size='lg'
                />
              </View>
              <View className='flex-1'>
                <Select
                  data={MINUTE_OPTIONS}
                  value={parts.minute}
                  onChange={(item) =>
                    setParts((prev) => ({
                      ...prev,
                      minute: String(item.value),
                    }))
                  }
                  placeholder='분'
                  size='lg'
                />
              </View>
            </View>
          ) : (
            <View className='flex-row gap-2'>
              <View className='flex-1'>
                <Select
                  data={YEAR_OPTIONS}
                  value={parts.year}
                  onChange={(item) =>
                    setParts((prev) => ({
                      ...prev,
                      year: String(item.value),
                    }))
                  }
                  placeholder='년'
                  size='lg'
                />
              </View>
              <View className='flex-1'>
                <Select
                  data={MONTH_OPTIONS}
                  value={parts.month}
                  onChange={(item) =>
                    setParts((prev) => ({
                      ...prev,
                      month: String(item.value),
                    }))
                  }
                  placeholder='월'
                  size='lg'
                />
              </View>
              <View className='flex-1'>
                <Select
                  data={dayOptions}
                  value={parts.day}
                  onChange={(item) =>
                    setParts((prev) => ({
                      ...prev,
                      day: String(item.value),
                    }))
                  }
                  placeholder='일'
                  size='lg'
                />
              </View>
            </View>
          )}

          <View className='mt-4 flex-row gap-2'>
            <Pressable
              onPress={onCancel}
              className='h-[52px] flex-1 items-center justify-center rounded-2xl bg-gray-200 dark:bg-gray-700'
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className='text-body font-medium text-content dark:text-content-dark'>취소</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className='h-[52px] flex-1 items-center justify-center rounded-2xl bg-black dark:bg-white'
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className='text-body font-semibold text-white dark:text-black'>확인</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export type { DatePickerProps, DatePickerMode }
