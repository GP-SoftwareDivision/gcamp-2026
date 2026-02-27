import { sensorApi } from '@/services/api'
import type { CurrentValues, SensorUnits } from '@/types/stores'
import useSWR from 'swr'

export type FarmSensorsData = {
  currentValues: CurrentValues
  currentUnits: SensorUnits
  fetchedAt: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeSensorType(value: string | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined

  const aliases: Record<string, string> = {
    carbondioxide: 'carbondioxide',
    carbonDioxide: 'carbondioxide',
    carbon_dioxide: 'carbondioxide',
    co2: 'carbondioxide',
    soiltemperature: 'soilTemperature',
    soil_temperature: 'soilTemperature',
    soilwater: 'soilWater',
    soil_water: 'soilWater',
    hydrogenion: 'hydrogenIon',
    hydrogen_ion: 'hydrogenIon',
  }

  if (aliases[value]) return aliases[value]
  if (aliases[normalized]) return aliases[normalized]

  if (normalized === 'temperature') return 'temperature'
  if (normalized === 'humidity') return 'humidity'
  if (normalized === 'insolation') return 'insolation'
  if (normalized === 'ec') return 'ec'

  return value
}

function normalizeUnit(value: string | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim()
  if (!normalized) return undefined

  if (normalized === 'degC') return '°C'
  if (normalized === 'W/m2') return 'W/m²'
  if (normalized === 'uS/cm') return 'μS/cm'

  return normalized
}

function extractSensorRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter((item) => typeof item === 'object' && item !== null) as Record<string, unknown>[]
  }

  const root = asRecord(raw)
  if (!root || root.success === false) return []

  const rootData = asRecord(root.data)
  const rootResult = asRecord(root.result)
  const rootDataResult = asRecord(rootData?.result)
  const rootResultData = asRecord(rootResult?.data)
  const candidates: unknown[] = [
    root.data,
    root.result,
    rootData?.result,
    rootResult?.data,
    rootData?.data,
    rootData?.items,
    rootData?.records,
    rootData?.list,
    rootResult?.items,
    rootResult?.records,
    rootResult?.list,
    rootDataResult?.items,
    rootDataResult?.records,
    rootDataResult?.list,
    rootResultData?.items,
    rootResultData?.records,
    rootResultData?.list,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const rows = candidate.filter((item) => typeof item === 'object' && item !== null) as Record<string, unknown>[]
      if (rows.length > 0) return rows
      continue
    }

    const record = asRecord(candidate)
    if (!record) continue

    for (const key of ['items', 'records', 'list', 'content']) {
      const value = record[key]
      if (!Array.isArray(value)) continue
      const rows = value.filter((item) => typeof item === 'object' && item !== null) as Record<string, unknown>[]
      if (rows.length > 0) return rows
    }
  }

  return []
}

function rowsToValuesAndUnits(rows: Record<string, unknown>[]): { values: CurrentValues; units: SensorUnits } {
  const values: CurrentValues = {}
  const units: SensorUnits = {}

  for (const row of rows) {
    const sensorType = normalizeSensorType(
      toNonEmptyString(row.type) ?? toNonEmptyString(row.sensorType) ?? toNonEmptyString(row.name),
    )
    const sensorValue = toNumber(row.value) ?? toNumber(row.sensorValue) ?? toNumber(row.avgValue)
    if (!sensorType || sensorValue === undefined) continue

    values[sensorType] = sensorValue

    const unit = normalizeUnit(toNonEmptyString(row.unit) ?? toNonEmptyString(row.sensorUnit))
    if (unit) {
      units[sensorType] = unit
    }
  }

  return { values, units }
}

export function useFarmSensors() {
  return useSWR<FarmSensorsData>(
    ['sensor', 'farm', 'recent'],
    async () => {
      const raw = await sensorApi.getRecentSensorData()
      const myRows = extractSensorRows(raw)
      if (myRows.length === 0) throw new Error('failed to fetch /sensor/recent')

      const myParsed = rowsToValuesAndUnits(myRows)

      return {
        currentValues: myParsed.values,
        currentUnits: myParsed.units,
        fetchedAt: Date.now(),
      }
    },
    {
      refreshInterval: 65_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )
}
