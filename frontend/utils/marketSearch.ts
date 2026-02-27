import { DEFAULT_SELECT_OPTION, GRADE_ORDER } from '@/constants/marketSearch'
import type { MarketSearchRecord, RecentMarketPriceItem } from '@/services/api/features/market'
import type {
  MarketSearchSelectOption,
  MarketSearchTableColumnKey,
  MarketSearchTableRecord,
  MarketSearchUnitOptionsMap,
} from '@/types/pages/tabs'
import dayjs from 'dayjs'

export function formatDisplayDateFromStore(value: string): string {
  const parsed = dayjs(value, 'YYYYMMDD', true)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY-MM-DD')
}

export function formatPriceDate(value: string | undefined): string {
  if (!value) return '-'
  if (value.length !== 8) return value
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

export function formatAveragePrice(value: string | number | undefined): string {
  if (value == null) return '-'
  if (typeof value === 'number') return value.toLocaleString()
  return value
}

export function getCellValue(
  record: MarketSearchTableRecord,
  columnKey: MarketSearchTableColumnKey,
): string {
  if (columnKey === 'priceDate') return formatPriceDate(record.priceDate)
  if (columnKey === 'itemName') return record.itemName ?? '-'
  if (columnKey === 'gradeName') return record.gradeName ?? '-'
  if (columnKey === 'unitName') return record.unitName ?? '-'
  return formatAveragePrice(record.averagePrice)
}

export function toDateValue(value: string, fallback: Date): Date {
  const parsed = dayjs(value, 'YYYYMMDD', true)
  return parsed.isValid() ? parsed.toDate() : fallback
}

export function buildSelectOptions(items: RecentMarketPriceItem[] | undefined): {
  itemOptions: MarketSearchSelectOption[]
  unitOptions: MarketSearchSelectOption[]
  gradeOptions: MarketSearchSelectOption[]
  unitOptionsByItemCode: MarketSearchUnitOptionsMap
} {
  const itemMap = new Map<string, string>()
  const unitSet = new Set<string>()
  const gradeSet = new Set<string>()
  const unitSetByItemCode = new Map<string, Set<string>>()

  if (Array.isArray(items)) {
    for (const item of items) {
      const records = Array.isArray(item.records) ? item.records : []

      for (const record of records) {
        const itemCode = record.itemCode?.trim() ?? ''
        const itemName = record.itemName?.trim() || item.productName?.trim() || itemCode
        const unitName = record.unitName?.trim() ?? ''
        const gradeName = record.gradeName?.trim() ?? ''

        if (itemCode && !itemMap.has(itemCode)) {
          itemMap.set(itemCode, itemName)
        }
        if (unitName) unitSet.add(unitName)
        if (gradeName) gradeSet.add(gradeName)
        if (itemCode && unitName) {
          const unitNames = unitSetByItemCode.get(itemCode) ?? new Set<string>()
          unitNames.add(unitName)
          unitSetByItemCode.set(itemCode, unitNames)
        }
      }
    }
  }

  const itemOptions: MarketSearchSelectOption[] = [
    DEFAULT_SELECT_OPTION,
    ...Array.from(itemMap.entries())
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ko-KR')),
  ]

  const unitOptions: MarketSearchSelectOption[] = [
    DEFAULT_SELECT_OPTION,
    ...Array.from(unitSet.values())
      .map((value) => ({ label: value, value }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ko-KR')),
  ]

  const gradeOptions: MarketSearchSelectOption[] = [
    DEFAULT_SELECT_OPTION,
    ...Array.from(gradeSet.values())
      .map((value) => ({ label: value, value }))
      .sort((a, b) => {
        const left = GRADE_ORDER[a.value] ?? 99
        const right = GRADE_ORDER[b.value] ?? 99
        if (left !== right) return left - right
        return a.label.localeCompare(b.label, 'ko-KR')
      }),
  ]

  const unitOptionsByItemCode: MarketSearchUnitOptionsMap = {}
  for (const [itemCode, unitNames] of unitSetByItemCode.entries()) {
    unitOptionsByItemCode[itemCode] = [
      DEFAULT_SELECT_OPTION,
      ...Array.from(unitNames.values())
        .map((value) => ({ label: value, value }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ko-KR')),
    ]
  }

  return { itemOptions, unitOptions, gradeOptions, unitOptionsByItemCode }
}

export function normalizeSearchRecords(
  records: MarketSearchRecord[] | undefined,
): MarketSearchTableRecord[] {
  if (!Array.isArray(records)) return []

  return records.map((record) => ({
    id: record.id,
    priceDate: record.priceDate,
    itemName: record.itemName,
    gradeName: record.gradeName,
    unitName: record.unitName,
    averagePrice: record.averagePrice,
  }))
}
