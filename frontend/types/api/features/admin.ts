import type { AuthenticationRes } from './auth'

export interface Pageable {
  page?: number
  size?: number
  sort?: string[]
}

export interface SensorSearchConditionReq {
  name?: string
  type?: string
  code?: string
  status?: string
}

export interface SensorKitSearchConditionReq {
  name?: string
  type?: string
  code?: string
  status?: string
}

export interface AccountSearchConditionReq {
  username?: string
  name?: string
  email?: string
  phone?: string
  role?: string
  createDateStr?: string
  createDateEnd?: string
}

export interface SensorRegisterReq {
  name?: string
  type?: string
  code?: string
}

export interface SensorUpdateReq {
  sensorId?: number
  name?: string
  type?: string
  code?: string
  status?: string
}

export interface FarmRegisterReq {
  farmName?: string
  zipCode?: number
  address?: string
  addressDetail?: string
  latitude?: number
  longitude?: number
  sensorKitCode?: string[]
  goodCode?: string
}

export type AdminRole = 'USER' | 'ADMIN' | 'LEADER' | string

export interface AccountRegisterAdminReq {
  username: string
  newPassword: string
  confirmationPassword: string
  name: string
  email?: string
  phone?: string
  role?: AdminRole
  farmRegisterReq?: FarmRegisterReq[]
}

export interface FarmRegisterAdminReq {
  username: string
  farmName: string
  zipCode: number
  address: string
  addressDetail: string
  goodCode: string
  mac: string
}

export interface FarmUpdateReq {
  farmId?: number
  farmName?: string
  zipCode?: number
  address?: string
  addressDetail?: string
  latitude?: number
  longitude?: number
  sensorKitCode?: string[]
  goodCode?: string
}

export interface AccountUpdateReq {
  username?: string
  name: string
  email?: string
  phone?: string
  farmUpdateReq?: FarmUpdateReq[]
}

export interface SensorListQuery {
  req: SensorSearchConditionReq
  pageable: Pageable
}

export interface SensorKitListQuery {
  req: SensorKitSearchConditionReq
  pageable: Pageable
}

export interface AccountListQuery {
  req: AccountSearchConditionReq
  pageable: Pageable
}

export type AdminResponse = Record<string, unknown>
export type RegisterAccountResponse = AuthenticationRes
