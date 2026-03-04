export interface SensorTypeSummaryReq {
  sensorType?: string
  type?: string
  showType?: 'daily' | 'weekly' | 'month' | 'monthly'
}

export type SensorResponse = Record<string, unknown>

export type SensorLimitType = 'MAX' | 'MIN'

export interface UpsertSensorLimitReq {
  mac: string
  sensorType: string
  limitType: SensorLimitType
  sensorLimitValue: number
  useFlag: boolean
}

export interface DeleteSensorLimitReq {
  mac: string
  sensorType: string
  limitType: SensorLimitType
}
