import type { SensorLimitType } from '@/types/api/features/sensor'
import type { SensorThresholdValue } from '@/types/stores'

export type SensorThresholdRule = {
  decimals: number
  integerOnly: boolean
}

const DEFAULT_RULE: SensorThresholdRule = { decimals: 0, integerOnly: true }

const SENSOR_THRESHOLD_RULES: Record<string, SensorThresholdRule> = {
  temperature: { decimals: 1, integerOnly: false },
  humidity: { decimals: 0, integerOnly: true },
  carbondioxide: { decimals: 0, integerOnly: true },
  insolation: { decimals: 0, integerOnly: true },
  ec: { decimals: 2, integerOnly: false },
  hydrogenIon: { decimals: 1, integerOnly: false },
  soilTemperature: { decimals: 1, integerOnly: false },
  soilWater: { decimals: 0, integerOnly: true },
}

export function getSensorThresholdRule(sensorType: string): SensorThresholdRule {
  return SENSOR_THRESHOLD_RULES[sensorType] ?? DEFAULT_RULE
}

export function getThresholdKeyboardType(sensorType: string): 'decimal-pad' | 'numeric' {
  const rule = getSensorThresholdRule(sensorType)
  return rule.integerOnly ? 'numeric' : 'decimal-pad'
}

export function formatThresholdInput(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return ''
  const fixed = value.toFixed(decimals)
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
}

export function parseThresholdInput(rawValue: string, integerOnly: boolean): number | null {
  const normalized = rawValue.trim().replace(',', '.')
  if (normalized.length === 0) return null
  if (integerOnly && normalized.includes('.')) return null

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

export function normalizeThresholdTextInput(rawValue: string, integerOnly: boolean): string {
  let value = rawValue.replace(/\s+/g, '').replace(/,/g, '.')
  value = integerOnly ? value.replace(/[^\d-]/g, '') : value.replace(/[^\d.-]/g, '')

  const hasLeadingMinus = value.startsWith('-')
  value = value.replace(/-/g, '')
  if (hasLeadingMinus) {
    value = `-${value}`
  }

  if (!integerOnly) {
    const firstDotIndex = value.indexOf('.')
    if (firstDotIndex !== -1) {
      value =
        value.slice(0, firstDotIndex + 1) + value.slice(firstDotIndex + 1).replace(/\./g, '')
    }
  }

  return value
}

export function normalizeThresholdValue(value: number, rule: SensorThresholdRule): number {
  if (rule.integerOnly) return Math.round(value)
  const scale = 10 ** rule.decimals
  return Math.round(value * scale) / scale
}

const SENSOR_TYPE_TO_API_MAP: Record<string, string> = {
  temperature: 'TEMP',
  humidity: 'HUM',
  carbondioxide: 'CO2',
  insolation: 'INSOLATION',
  ec: 'EC',
  hydrogenIon: 'PH',
  soilTemperature: 'SOIL_TEMP',
  soilWater: 'SOIL_HUM',
}

function normalizeApiSensorTypeFallback(sensorType: string): string {
  return sensorType.trim().replace(/([a-z])([A-Z])/g, '$1_$2').replace(/-/g, '_').toUpperCase()
}

export function toSensorLimitApiSensorType(sensorType: string): string {
  const direct = SENSOR_TYPE_TO_API_MAP[sensorType]
  if (direct) return direct

  const normalized = sensorType.trim().toLowerCase()
  return SENSOR_TYPE_TO_API_MAP[normalized] ?? normalizeApiSensorTypeFallback(sensorType)
}

export type SensorThresholdSyncAction = 'create' | 'update' | 'delete'

export type SensorThresholdSyncPlan = {
  action: SensorThresholdSyncAction
  limitType: SensorLimitType
  value: number | null
}

function buildLimitSyncPlan(
  previousValue: number | null | undefined,
  nextValue: number | null | undefined,
  limitType: SensorLimitType,
): SensorThresholdSyncPlan | null {
  const prev = previousValue ?? null
  const next = nextValue ?? null

  if (prev === next) return null
  if (next == null) return { action: 'delete', limitType, value: null }
  if (prev == null) return { action: 'create', limitType, value: next }
  return { action: 'update', limitType, value: next }
}

export function buildSensorThresholdSyncPlans(
  previous: SensorThresholdValue | null | undefined,
  next: SensorThresholdValue,
): SensorThresholdSyncPlan[] {
  const minPlan = buildLimitSyncPlan(previous?.min, next.min, 'MIN')
  const maxPlan = buildLimitSyncPlan(previous?.max, next.max, 'MAX')
  return [minPlan, maxPlan].filter((plan): plan is SensorThresholdSyncPlan => plan !== null)
}

function hasConfiguredThreshold(value: SensorThresholdValue | null | undefined): boolean {
  if (!value) return false
  return value.min != null || value.max != null
}

export type SensorThresholdUiAction = 'none' | 'create' | 'update' | 'reset'

export function getSensorThresholdUiAction(
  previous: SensorThresholdValue | null | undefined,
  next: SensorThresholdValue | null | undefined,
): SensorThresholdUiAction {
  const hasPrevious = hasConfiguredThreshold(previous)
  const hasNext = hasConfiguredThreshold(next)

  if (!hasPrevious && !hasNext) return 'none'
  if (!hasPrevious && hasNext) return 'create'
  if (hasPrevious && !hasNext) return 'reset'

  if (previous?.min === next?.min && previous?.max === next?.max) return 'none'
  return 'update'
}
