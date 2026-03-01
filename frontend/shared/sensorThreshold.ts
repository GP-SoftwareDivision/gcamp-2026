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
  return value.toFixed(decimals).replace(/\.?0+$/, '')
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
