export type DatePickerPartKey = 'year' | 'month' | 'day' | 'hour' | 'minute'

export type DatePickerParts = Record<DatePickerPartKey, string>

export type DatePickerSelectOption = {
  label: string
  value: string
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function createNumberOptions(
  start: number,
  end: number,
  shouldPad = false,
): DatePickerSelectOption[] {
  const options: DatePickerSelectOption[] = []

  for (let value = start; value <= end; value += 1) {
    const normalized = shouldPad ? pad2(value) : String(value)
    options.push({
      label: normalized,
      value: String(value),
    })
  }

  return options
}

const currentYear = new Date().getFullYear()

export const YEAR_OPTIONS = createNumberOptions(currentYear - 20, currentYear + 20)
export const MONTH_OPTIONS = createNumberOptions(1, 12, true)
export const HOUR_OPTIONS = createNumberOptions(0, 23, true)
export const MINUTE_OPTIONS = createNumberOptions(0, 59, true)

export function createDatePickerParts(date: Date): DatePickerParts {
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1),
    day: String(date.getDate()),
    hour: String(date.getHours()),
    minute: String(date.getMinutes()),
  }
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getMaxDayFromParts(yearValue: string, monthValue: string): number {
  const year = Number(yearValue)
  const month = Number(monthValue)

  if (!Number.isFinite(year) || !Number.isFinite(month)) return 31
  return getDaysInMonth(year, month)
}

export function clampDayPart(dayValue: string, maxDay: number): string {
  const day = Number(dayValue)
  if (!Number.isFinite(day)) return dayValue
  if (day <= maxDay) return dayValue
  return String(maxDay)
}

export function buildDayOptions(maxDay: number): DatePickerSelectOption[] {
  return createNumberOptions(1, maxDay, true)
}
