import { sensorApi } from '@/services/api'
import axios from 'axios'
import useSWR from 'swr'

type SummaryPeriod = 'daily' | 'weekly' | 'monthly'

type SummaryPoint = {
  label: string
  avgValue: number
}

type SummarySeries = Record<SummaryPeriod, SummaryPoint[]>

export type SensorSummaryData = {
  my: SummarySeries
  leader: SummarySeries
}

const EMPTY_SERIES: SummarySeries = {
  daily: [],
  weekly: [],
  monthly: [],
}

const EMPTY_SUMMARY_DATA: SensorSummaryData = {
  my: EMPTY_SERIES,
  leader: EMPTY_SERIES,
}

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

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function toLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toPointArray(value: unknown): SummaryPoint[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const row = asRecord(item)
      if (!row) return null

      const label =
        toLabel(row.label) ??
        toLabel(row.timeLabel) ??
        toLabel(row.time) ??
        toLabel(row.date)
      const avgValue = toNumber(row.avgValue) ?? toNumber(row.value)
      if (!label || avgValue === undefined) return null

      return { label, avgValue }
    })
    .filter((point): point is SummaryPoint => point !== null)
}

function toSeries(value: unknown): SummarySeries {
  const record = asRecord(tryParseJson(value))
  if (!record) return EMPTY_SERIES

  return {
    daily: toPointArray(record.daily),
    weekly: toPointArray(record.weekly),
    monthly: toPointArray(record.monthly),
  }
}

function parseSummary(raw: unknown): SensorSummaryData {
  const normalizedRaw = tryParseJson(raw)
  const root = asRecord(normalizedRaw)
  if (!root) return EMPTY_SUMMARY_DATA

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
      my: toSeries(candidate.my),
      leader: toSeries(candidate.leader),
    }
  }

  return EMPTY_SUMMARY_DATA
}

export function useSensorSummary(type?: string | string[]) {
  const rawType = Array.isArray(type) ? type[0] : type
  const normalizedType = typeof rawType === 'string' ? rawType.trim() : ''
  const key = normalizedType ? ['sensor', 'summary', normalizedType] : null

  return useSWR<SensorSummaryData>(
    key,
    async ([, , nextType]) => {
      console.log('[sensor/summary] request', {
        sensorType: nextType,
        at: new Date().toISOString(),
      })
      const raw = await sensorApi.getSensorTypeSummary({ sensorType: nextType })
      const parsed = parseSummary(raw)
      console.log('[sensor/summary] response', {
        sensorType: nextType,
        myDaily: parsed.my.daily.length,
        leaderDaily: parsed.leader.daily.length,
      })
      return parsed
    },
    {
      refreshInterval: 65_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onError(error) {
        const axiosError = axios.isAxiosError(error) ? error : null
        console.log('[sensor/summary] error', {
          sensorType: normalizedType,
          message: error instanceof Error ? error.message : String(error),
          status: axiosError?.response?.status,
          data: axiosError?.response?.data,
        })
      },
    }
  )
}
