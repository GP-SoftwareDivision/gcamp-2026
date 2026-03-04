export type SummaryPeriod = 'daily' | 'weekly' | 'monthly'

export type SensorSummaryPoint = {
  label: string
  avgValue: number
}

export type SensorChartData = {
  labels: string[]
  myFarm: number[]
  leadFarm: number[]
}

const EMPTY_CHART_DATA: SensorChartData = {
  labels: [],
  myFarm: [],
  leadFarm: [],
}

export const EMPTY_SENSOR_UNIT_MAP: Record<string, string> = {}

export function buildSensorChartData(
  mySeries: SensorSummaryPoint[],
  leaderSeries: SensorSummaryPoint[],
  sensorType: string,
): SensorChartData {
  const maxLen = Math.max(mySeries.length, leaderSeries.length)
  if (maxLen === 0) return EMPTY_CHART_DATA

  const labels: string[] = []
  const myFarm: number[] = []
  const leadFarm: number[] = []

  for (let i = 0; i < maxLen; i += 1) {
    const my = mySeries[i]
    const leader = leaderSeries[i]
    const label = my?.label ?? leader?.label
    if (!label) continue

    labels.push(label)
    const myValue = my?.avgValue ?? 0
    const leaderValue = leader?.avgValue ?? 0
    myFarm.push(sensorType === 'ec' ? myValue / 1000 : myValue)
    leadFarm.push(sensorType === 'ec' ? leaderValue / 1000 : leaderValue)
  }

  if (labels.length === 0) return EMPTY_CHART_DATA
  return { labels, myFarm, leadFarm }
}

export function formatSensorValue(sensorId: string, value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (sensorId === 'carbondioxide' || sensorId === 'insolation') return String(Math.round(value))
  if (sensorId === 'humidity' || sensorId === 'soilWater') return String(Math.round(value))
  if (sensorId === 'ec') return (value / 1000).toFixed(2).replace(/\.?0+$/, '')
  if (sensorId === 'hydrogenIon') return value.toFixed(1)
  return value.toFixed(1)
}

export function normalizeSensorType(type: string): string {
  const normalized = type.trim().toLowerCase()
  if (normalized === 'carbondioxide' || normalized === 'carbon_dioxide' || normalized === 'co2') {
    return 'carbondioxide'
  }
  return type
}
