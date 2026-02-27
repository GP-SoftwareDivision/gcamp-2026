import { callApi } from '../../core'
import { API_REQUESTS } from '../../contracts'
import type {
  AccountListQuery,
  AccountRegisterAdminReq,
  AccountUpdateReq,
  AdminResponse,
  FarmRegisterAdminReq,
  RegisterAccountResponse,
  SensorKitListQuery,
  SensorListQuery,
  SensorRegisterReq,
  SensorUpdateReq,
} from './types'

export async function getSensorList(params: SensorListQuery): Promise<AdminResponse> {
  return callApi<AdminResponse, never, SensorListQuery>({
    ...API_REQUESTS.admin.getSensorList,
    params,
  })
}

export async function registerSensor(payload: SensorRegisterReq): Promise<AdminResponse> {
  return callApi<AdminResponse, SensorRegisterReq>({
    ...API_REQUESTS.admin.registerSensor,
    data: payload,
  })
}

export async function updateSensor(payload: SensorUpdateReq): Promise<AdminResponse> {
  return callApi<AdminResponse, SensorUpdateReq>({
    ...API_REQUESTS.admin.updateSensor,
    data: payload,
  })
}

export async function getSensorDetail(code: string): Promise<AdminResponse> {
  return callApi<AdminResponse>({
    ...API_REQUESTS.admin.getSensorDetail(code),
  })
}

export async function getSensorKitList(params: SensorKitListQuery): Promise<AdminResponse> {
  return callApi<AdminResponse, never, SensorKitListQuery>({
    ...API_REQUESTS.admin.getSensorKitList,
    params,
  })
}

export async function getSensorKitDetail(code: string): Promise<AdminResponse> {
  return callApi<AdminResponse>({
    ...API_REQUESTS.admin.getSensorKitDetail(code),
  })
}

export async function registerFarm(payload: FarmRegisterAdminReq): Promise<AdminResponse> {
  return callApi<AdminResponse, FarmRegisterAdminReq>({
    ...API_REQUESTS.admin.registerFarm,
    data: payload,
  })
}

export async function registerAccount(
  payload: AccountRegisterAdminReq
): Promise<RegisterAccountResponse> {
  return callApi<RegisterAccountResponse, AccountRegisterAdminReq>({
    ...API_REQUESTS.admin.registerAccount,
    data: payload,
  })
}

export async function getAccountList(params: AccountListQuery): Promise<AdminResponse> {
  return callApi<AdminResponse, never, AccountListQuery>({
    ...API_REQUESTS.admin.getAccountList,
    params,
  })
}

export async function updateAccount(payload: AccountUpdateReq): Promise<AdminResponse> {
  return callApi<AdminResponse, AccountUpdateReq>({
    ...API_REQUESTS.admin.updateAccount,
    data: payload,
  })
}

export async function getAccountDetail(username: string): Promise<AdminResponse> {
  return callApi<AdminResponse>({
    ...API_REQUESTS.admin.getAccountDetail(username),
  })
}

export async function randomChangePassword(username: string): Promise<AdminResponse> {
  return callApi<AdminResponse>({
    ...API_REQUESTS.admin.randomChangePassword(username),
  })
}

export async function getAllGood(): Promise<AdminResponse> {
  return callApi<AdminResponse>({
    ...API_REQUESTS.admin.getAllGood,
  })
}
