import type { DatedPoint, MarketChartData } from '@/types/pages'

export const DAY_MS = 24 * 60 * 60 * 1000

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

export function readParamValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return readString(value)
  if (Array.isArray(value)) return readString(value[0])
  return undefined
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const normalized = value.replaceAll(',', '').trim()
  if (!normalized) return undefined

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseYyyyMmDd(value: string | undefined): Date | null {
  if (!value || value.length !== 8) return null
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return new Date(year, month - 1, day)
}

export function resolveDateFromMmdd(mmdd: string, baseDate: Date): Date | null {
  if (mmdd.length !== 4) return null
  const month = Number(mmdd.slice(0, 2))
  const day = Number(mmdd.slice(2, 4))
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null

  const year = baseDate.getFullYear()
  const candidate = new Date(year, month - 1, day)
  const diffDays = Math.round((candidate.getTime() - baseDate.getTime()) / DAY_MS)

  if (diffDays > 183) {
    candidate.setFullYear(year - 1)
  } else if (diffDays < -183) {
    candidate.setFullYear(year + 1)
  }

  return candidate
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatMmddLabel(mmdd: string): string {
  if (mmdd.length !== 4) return mmdd
  const month = Number(mmdd.slice(0, 2))
  const day = Number(mmdd.slice(2, 4))
  if (!Number.isFinite(month) || !Number.isFinite(day)) return mmdd
  return `${month}/${day}`
}

export function formatMonthDayKorean(date: Date): string {
  return String(date.getMonth() + 1) + '/' + String(date.getDate())
}

function buildMmddRange(startDate: string | undefined, endDate: string | undefined): string[] {
  const start = parseYyyyMmDd(startDate)
  const end = parseYyyyMmDd(endDate)
  if (!start || !end) return []

  const startMs = startOfDay(start).getTime()
  const endMs = startOfDay(end).getTime()
  if (endMs < startMs) return []

  const result: string[] = []
  let cursorMs = startMs
  let guard = 0
  const maxDays = 370

  while (cursorMs <= endMs && guard < maxDays) {
    const cursor = new Date(cursorMs)
    const mm = String(cursor.getMonth() + 1).padStart(2, '0')
    const dd = String(cursor.getDate()).padStart(2, '0')
    result.push(`${mm}${dd}`)
    cursorMs += DAY_MS
    guard += 1
  }

  return result
}

function extractMarketRangeResult(raw: unknown): Record<string, unknown> | null {
  const root = asRecord(raw)
  if (!root) return null

  const data = asRecord(root.data)
  const result = asRecord(root.result)
  const dataResult = asRecord(data?.result)

  return dataResult ?? data ?? result ?? root
}

export function parseMarketChartData(
  raw: unknown,
  fallback: {
    itemCode: string
    gradeName: string
    itemName: string
    unitName: string
    today: string
  },
): MarketChartData | null {
  const result = extractMarketRangeResult(raw)
  if (!result) return null

  const threeYearMap = new Map<string, number | null>()
  const threeYearOrder: string[] = []

  for (const row of toRecordArray(result.averages)) {
    const mmdd = readString(row.mmdd)
    if (!mmdd) continue

    threeYearOrder.push(mmdd)
    threeYearMap.set(mmdd, readNumber(row.averagePrice) ?? null)
  }

  const recentMap = new Map<string, number | null>()
  const recentRange = asRecord(result.upToMinus7Days)
  const recentDates = toRecordArray(recentRange?.dates)

  for (const row of recentDates) {
    const priceDate = readString(row.priceDate)
    const mmdd = priceDate && priceDate.length >= 8 ? priceDate.slice(-4) : undefined
    if (!mmdd) continue

    const prices = toRecordArray(row.prices)
    const priceValues = prices
      .map((priceRow) => readNumber(priceRow.averagePrice))
      .filter((value): value is number => value !== undefined)

    if (priceValues.length === 0) {
      recentMap.set(mmdd, null)
      continue
    }

    const average = priceValues.reduce((sum, value) => sum + value, 0) / priceValues.length
    recentMap.set(mmdd, average)
  }

  const lastYearMap = new Map<string, number | null>()
  const oneYearAgoRange = asRecord(result.oneYearAgoRange)
  const dates = toRecordArray(oneYearAgoRange?.dates)

  for (const row of dates) {
    const priceDate = readString(row.priceDate)
    const mmdd = priceDate && priceDate.length >= 8 ? priceDate.slice(-4) : undefined
    if (!mmdd) continue

    const prices = toRecordArray(row.prices)
    const priceValues = prices
      .map((priceRow) => readNumber(priceRow.averagePrice))
      .filter((value): value is number => value !== undefined)

    if (priceValues.length === 0) {
      lastYearMap.set(mmdd, null)
      continue
    }

    const average = priceValues.reduce((sum, value) => sum + value, 0) / priceValues.length
    lastYearMap.set(mmdd, average)
  }

  const mmddSet = new Set([
    ...threeYearOrder,
    ...Array.from(recentMap.keys()),
    ...Array.from(lastYearMap.keys()),
  ])
  const startDate =
    readString(result.startDate) ??
    readString(recentRange?.startDate) ??
    readString(oneYearAgoRange?.startDate)
  const endDate =
    readString(result.endDate) ??
    readString(recentRange?.endDate) ??
    readString(oneYearAgoRange?.endDate)
  const timelineMmdd = buildMmddRange(startDate, endDate)
  const orderedMmdd =
    timelineMmdd.length > 0 ? timelineMmdd : Array.from(mmddSet).sort((a, b) => a.localeCompare(b))
  if (orderedMmdd.length === 0) return null

  const todayValue = readString(result.today) ?? fallback.today
  const todayDate = parseYyyyMmDd(todayValue)
  const todayStartMs = todayDate ? startOfDay(todayDate).getTime() : Number.POSITIVE_INFINITY

  const points = orderedMmdd.map((mmdd) => {
    const pointDate = todayDate ? resolveDateFromMmdd(mmdd, todayDate) : null
    const isFuture = pointDate ? startOfDay(pointDate).getTime() > todayStartMs : false
    return {
      mmdd,
      label: formatMmddLabel(mmdd),
      currentPrice: isFuture ? null : (recentMap.get(mmdd) ?? null),
      lastYearAvgPrice: lastYearMap.get(mmdd) ?? null,
      threeYearAvgPrice: threeYearMap.get(mmdd) ?? null,
    }
  })

  return {
    today: todayValue,
    itemCode: readString(result.itemCode) ?? fallback.itemCode,
    itemName: readString(result.itemName) ?? fallback.itemName,
    unitName: readString(result.unitName) ?? fallback.unitName,
    gradeName: readString(result.grade) ?? readString(result.gradeName) ?? fallback.gradeName,
    points,
  }
}

export function toDatedPoints(chartData: MarketChartData | null, baseDate: Date): DatedPoint[] {
  if (!chartData) return []

  return chartData.points
    .map((point) => {
      const date = resolveDateFromMmdd(point.mmdd, baseDate)
      return date ? { ...point, date } : null
    })
    .filter((point): point is DatedPoint => point !== null)
}
