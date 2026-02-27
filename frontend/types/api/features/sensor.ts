export interface SensorTypeSummaryReq {
  sensorType?: string
  type?: string
  showType?: 'daily' | 'weekly' | 'month' | 'monthly'
}

export type SensorResponse = Record<string, unknown>
