import { marketApi } from '@/services/api'
import type { TomatoSection } from '@/types/pages/tabs'
import type { MarketStore } from '@/types/stores'
import { create } from 'zustand'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const normalized = value.replaceAll(',', '').trim()
  if (!normalized) return undefined

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function getGradeSortOrder(gradeName: string): number {
  const order: Record<string, number> = {
    특: 0,
    상: 1,
    중: 2,
    하: 3,
  }
  return order[gradeName] ?? 99
}

function getKstDateKey(nowMs = Date.now()): string {
  const date = new Date(nowMs + KST_OFFSET_MS)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function extractItemRows(raw: unknown): Record<string, unknown>[] {
  const root = asRecord(raw)
  if (!root) return []

  const rootData = asRecord(root.data)
  const rootResult = asRecord(root.result)
  const rootDataResult = asRecord(rootData?.result)
  const rootResultData = asRecord(rootResult?.data)

  const candidates: unknown[] = [
    root.items,
    rootData?.items,
    rootResult?.items,
    rootDataResult?.items,
    rootResultData?.items,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return toRecordArray(candidate)
  }

  return []
}

type ParsedRecentRecord = {
  priceDate: string
  itemName: string
  itemCode: string
  unitName: string
  gradeName: string
  averagePrice: number
}

function parseRecentRecord(record: Record<string, unknown>): ParsedRecentRecord | null {
  const priceDate = readString(record.priceDate)
  const itemName = readString(record.itemName)
  const itemCode = readString(record.itemCode)
  const unitName = readString(record.unitName)
  const gradeName = readString(record.gradeName)
  const averagePrice = readNumber(record.averagePrice)

  if (!priceDate || !itemName || !itemCode || !unitName || !gradeName || averagePrice === undefined) {
    return null
  }

  return {
    priceDate,
    itemName,
    itemCode,
    unitName,
    gradeName,
    averagePrice,
  }
}

function parseSectionsFromRecentPrices(raw: unknown): TomatoSection[] {
  const itemRows = extractItemRows(raw)
  if (!itemRows.length) return []
  const sectionMap = new Map<string, TomatoSection['grades']>()

  for (const itemRow of itemRows) {
    const productName = readString(itemRow.productName)
    const records = toRecordArray(itemRow.records)
      .map(parseRecentRecord)
      .filter((item): item is ParsedRecentRecord => item !== null)

    if (records.length === 0) continue

    const byGradeKey = new Map<string, typeof records>()
    for (const row of records) {
      const key = `${row.itemCode}::${row.unitName}::${row.gradeName}`
      const bucket = byGradeKey.get(key) ?? []
      bucket.push(row)
      byGradeKey.set(key, bucket)
    }

    const sectionTitle =
      productName ?? `${records[0].itemName} ${records[0].unitName}`
    const grades = sectionMap.get(sectionTitle) ?? []

    for (const rows of byGradeKey.values()) {
      const sorted = [...rows].sort((a, b) => b.priceDate.localeCompare(a.priceDate))
      const latest = sorted[0]
      const previous = sorted[1] ?? latest

      const gradeItem: TomatoSection['grades'][number] = {
        id: `${latest.itemCode}-${latest.unitName}-${latest.gradeName}`,
        label: `${latest.itemName}(${latest.gradeName})`,
        price: Math.round(latest.averagePrice),
        prevPrice: Math.round(previous.averagePrice),
        itemCode: latest.itemCode,
        gradeName: latest.gradeName,
        unitName: latest.unitName,
      }
      grades.push(gradeItem)
    }

    grades.sort((a, b) => getGradeSortOrder(a.gradeName) - getGradeSortOrder(b.gradeName))
    sectionMap.set(sectionTitle, grades)
  }

  return Array.from(sectionMap.entries()).map(([title, grades]) => ({
    title,
    grades,
  }))
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  sections: [],
  cacheDateKey: null,
  isLoading: false,
  requestInFlight: null,
  selectedQuery: null,

  setSelectedQuery: (query) => {
    set({ selectedQuery: query })
  },

  fetchRecentlyPrices: async (options) => {
    const force = options?.force === true
    const todayKey = getKstDateKey()
    const state = get()

    if (!force && state.sections.length > 0 && state.cacheDateKey === todayKey) {
      return state.sections
    }

    if (state.requestInFlight) {
      return state.requestInFlight
    }

    const request = (async () => {
      set({ isLoading: true })
      try {
        const response = await marketApi.getRecentlyPrices()
        const parsedSections = parseSectionsFromRecentPrices(response)
        set({
          sections: parsedSections,
          cacheDateKey: todayKey,
        })
        return parsedSections
      } catch {
        return get().sections
      } finally {
        set({
          requestInFlight: null,
          isLoading: false,
        })
      }
    })()

    set({ requestInFlight: request })
    return request
  },
}))
