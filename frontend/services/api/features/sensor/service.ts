import { callApi } from '../../core'
import { API_REQUESTS } from '../../contracts'
import type {
  DeleteSensorLimitReq,
  SensorResponse,
  SensorTypeSummaryReq,
  UpsertSensorLimitReq,
} from './types'
import { isAxiosError } from 'axios'

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

export async function createSensorLimit(data: UpsertSensorLimitReq): Promise<SensorResponse> {
  console.log('[sensor/limit] create request', data)
  try {
    const response = await callApi<SensorResponse, UpsertSensorLimitReq>({
      ...API_REQUESTS.sensor.createSensorLimit,
      data,
    })
    console.log('[sensor/limit] create success', {
      sensorType: data.sensorType,
      limitType: data.limitType,
      mac: data.mac,
    })
    return response
  } catch (error) {
    console.log('[sensor/limit] create error', {
      status: isAxiosError(error) ? error.response?.status : undefined,
      message: error instanceof Error ? error.message : String(error),
      data: isAxiosError(error) ? error.response?.data : undefined,
    })
    throw error
  }
}

export async function updateSensorLimit(data: UpsertSensorLimitReq): Promise<SensorResponse> {
  console.log('[sensor/limit] update request', data)
  try {
    const response = await callApi<SensorResponse, UpsertSensorLimitReq>({
      ...API_REQUESTS.sensor.updateSensorLimit,
      data,
    })
    console.log('[sensor/limit] update success', {
      sensorType: data.sensorType,
      limitType: data.limitType,
      mac: data.mac,
    })
    return response
  } catch (error) {
    console.log('[sensor/limit] update error', {
      status: isAxiosError(error) ? error.response?.status : undefined,
      message: error instanceof Error ? error.message : String(error),
      data: isAxiosError(error) ? error.response?.data : undefined,
    })
    throw error
  }
}

export async function deleteSensorLimit(params: DeleteSensorLimitReq): Promise<SensorResponse> {
  console.log('[sensor/limit] delete request', params)
  try {
    const response = await callApi<SensorResponse, never, DeleteSensorLimitReq>({
      ...API_REQUESTS.sensor.deleteSensorLimit,
      params,
    })
    console.log('[sensor/limit] delete success', params)
    return response
  } catch (error) {
    console.log('[sensor/limit] delete error', {
      status: isAxiosError(error) ? error.response?.status : undefined,
      message: error instanceof Error ? error.message : String(error),
      data: isAxiosError(error) ? error.response?.data : undefined,
    })
    throw error
  }
}
