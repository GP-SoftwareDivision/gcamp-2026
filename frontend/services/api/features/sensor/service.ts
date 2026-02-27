import { callApi } from '../../core'
import { API_REQUESTS } from '../../contracts'
import type { SensorResponse, SensorTypeSummaryReq } from './types'

export async function getSensorTypeSummary(
  params: SensorTypeSummaryReq
): Promise<SensorResponse> {
  return callApi<SensorResponse, never, SensorTypeSummaryReq>({
    ...API_REQUESTS.sensor.getSensorTypeSummary,
    params,
  })
}

export async function getRecentSensorData(): Promise<SensorResponse> {
  return callApi<SensorResponse>({
    ...API_REQUESTS.sensor.getRecentSensorData,
  })
}
