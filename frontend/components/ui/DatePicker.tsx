import { useEffect, useMemo, useState } from 'react'
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

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// 공통 DatePicker 래퍼 컴포넌트
// 사용 예: <DatePicker isVisible={open} mode="date" date={value} onConfirm={...} onCancel={...} />
export function DatePicker({ isVisible, mode, date, onConfirm, onCancel }: DatePickerProps) {
  const [year, setYear] = useState(String(date.getFullYear()))
  const [month, setMonth] = useState(String(date.getMonth() + 1))
  const [day, setDay] = useState(String(date.getDate()))
  const [hour, setHour] = useState(String(date.getHours()))
  const [minute, setMinute] = useState(String(date.getMinutes()))

  useEffect(() => {
    if (!isVisible) return
    setYear(String(date.getFullYear()))
    setMonth(String(date.getMonth() + 1))
    setDay(String(date.getDate()))
    setHour(String(date.getHours()))
    setMinute(String(date.getMinutes()))
  }, [date, isVisible])

  const maxDay = useMemo(() => {
    const parsedYear = Number(year)
    const parsedMonth = Number(month)
    if (!Number.isFinite(parsedYear) || !Number.isFinite(parsedMonth)) return 31
    return getDaysInMonth(parsedYear, parsedMonth)
  }, [year, month])

  useEffect(() => {
    const parsedDay = Number(day)
    if (!Number.isFinite(parsedDay)) return
    if (parsedDay <= maxDay) return
    setDay(String(maxDay))
  }, [day, maxDay])

  const yearOptions: SelectOption[] = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const start = currentYear - 20
    const end = currentYear + 20
    const options: SelectOption[] = []
    for (let value = start; value <= end; value += 1) {
      options.push({ label: String(value), value: String(value) })
    }
    return options
  }, [])

  const monthOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => {
        const value = idx + 1
        return { label: pad2(value), value: String(value) }
      }),
    [],
  )

  const dayOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: maxDay }, (_, idx) => {
        const value = idx + 1
        return { label: pad2(value), value: String(value) }
      }),
    [maxDay],
  )

  const hourOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: 24 }, (_, idx) => ({
        label: pad2(idx),
        value: String(idx),
      })),
    [],
  )

  const minuteOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: 60 }, (_, idx) => ({
        label: pad2(idx),
        value: String(idx),
      })),
    [],
  )

  const handleConfirm = () => {
    const baseYear = Number(year)
    const baseMonth = Number(month)
    const baseDay = Number(day)
    const baseHour = Number(hour)
    const baseMinute = Number(minute)

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
                  data={hourOptions}
                  value={hour}
                  onChange={(item) => setHour(String(item.value))}
                  placeholder='시'
                  size='lg'
                />
              </View>
              <View className='flex-1'>
                <Select
                  data={minuteOptions}
                  value={minute}
                  onChange={(item) => setMinute(String(item.value))}
                  placeholder='분'
                  size='lg'
                />
              </View>
            </View>
          ) : (
            <View className='flex-row gap-2'>
              <View className='flex-1'>
                <Select
                  data={yearOptions}
                  value={year}
                  onChange={(item) => setYear(String(item.value))}
                  placeholder='년'
                  size='lg'
                />
              </View>
              <View className='flex-1'>
                <Select
                  data={monthOptions}
                  value={month}
                  onChange={(item) => setMonth(String(item.value))}
                  placeholder='월'
                  size='lg'
                />
              </View>
              <View className='flex-1'>
                <Select
                  data={dayOptions}
                  value={day}
                  onChange={(item) => setDay(String(item.value))}
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
