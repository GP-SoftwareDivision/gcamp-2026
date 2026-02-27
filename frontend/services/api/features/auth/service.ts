import { callApi } from '../../core'
import { API_REQUESTS } from '../../contracts'
import type { AuthFarm, AuthenticationReq, AuthenticationRes } from './types'

const ACCESS_TOKEN_KEYS = ['access_token', 'accessToken', 'token', 'jwt', 'id_token', 'idToken']
const REFRESH_TOKEN_KEYS = ['refresh_token', 'refreshToken']
const USERNAME_KEYS = ['username', 'userName', 'user_id', 'userId', 'loginId', 'id']
const NAME_KEYS = ['name', 'fullName', 'nickname']
const PHONE_KEYS = ['phone', 'phoneNumber', 'mobile', 'mobilePhone', 'contact']
const ROLE_KEYS = ['role', 'userRole', 'authority']
const FARMS_KEYS = ['farms']

const FARM_ADDRESS_KEYS = ['farmAddress', 'address', 'addr']
const FARM_LATITUDE_KEYS = ['farmLatitude', 'latitude', 'lat']
const FARM_LONGITUDE_KEYS = ['farmLongitude', 'longitude', 'lon', 'lot']
const FARM_IPCAM_KEYS = ['ipcam_address', 'ipcamAddress', 'rtsp', 'rtspUrl']

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) return null
  return value as Record<string, unknown>
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return undefined
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = Number(value.trim())
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function deepFindString(
  source: unknown,
  keys: string[],
  depth = 0
): string | undefined {
  if (depth > 5) return undefined

  if (typeof source === 'string' && source.trim().length > 0) {
    return source
  }

  if (Array.isArray(source)) {
    for (const item of source) {
      const value = deepFindString(item, keys, depth + 1)
      if (value) return value
    }
    return undefined
  }

  const record = asRecord(source)
  if (!record) return undefined

  for (const key of keys) {
    const direct = pickString(record[key])
    if (direct) return direct
  }

  for (const value of Object.values(record)) {
    const nested = deepFindString(value, keys, depth + 1)
    if (nested) return nested
  }

  return undefined
}

function deepFindRecordArray(
  source: unknown,
  keys: string[],
  depth = 0
): Record<string, unknown>[] | undefined {
  if (depth > 5) return undefined

  if (Array.isArray(source)) {
    const records = source.filter((item) => asRecord(item) !== null) as Record<string, unknown>[]
    if (records.length > 0) return records

    for (const item of source) {
      const nested = deepFindRecordArray(item, keys, depth + 1)
      if (nested && nested.length > 0) return nested
    }
    return undefined
  }

  const record = asRecord(source)
  if (!record) return undefined

  for (const key of keys) {
    const candidate = record[key]
    if (!Array.isArray(candidate)) continue
    const records = candidate
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null)
    if (records.length > 0) return records
  }

  for (const value of Object.values(record)) {
    const nested = deepFindRecordArray(value, keys, depth + 1)
    if (nested && nested.length > 0) return nested
  }

  return undefined
}

function normalizeAuthFarm(raw: Record<string, unknown>): AuthFarm {
  const address = pickString(raw.address, raw.addr)
  const latitude = pickNumber(raw.latitude, raw.lat)
  const longitude = pickNumber(raw.longitude, raw.lon)
  const farmId = pickNumber(raw.farmId, raw.id)
  const farmName = pickString(raw.farmName, raw.name)
  const ipcamAddress = pickString(raw.ipcam_address, raw.ipcamAddress, raw.rtsp, raw.rtspUrl)

  return {
    farmId,
    farmName,
    address,
    latitude,
    longitude,
    ipcamAddress,
  }
}

function normalizeAuthenticationResponse(
  raw: unknown,
  fallbackUsername?: string
): AuthenticationRes {
  const root = asRecord(raw)
  const data = asRecord(root?.data)
  const result = asRecord(root?.result)
  const dataResult = asRecord(data?.result)
  const payload = dataResult ?? data ?? result ?? root

  if (!payload) {
    throw new Error('[auth] invalid authenticate response shape')
  }

  const accessToken = deepFindString(payload, ACCESS_TOKEN_KEYS)
  const refreshToken = deepFindString(payload, REFRESH_TOKEN_KEYS) ?? accessToken
  const username = deepFindString(payload, USERNAME_KEYS) ?? fallbackUsername ?? 'unknown'
  const name = deepFindString(payload, NAME_KEYS) ?? ''
  const phone =
    pickString(
      payload.phone,
      payload.phoneNumber,
      payload.mobile,
      payload.mobilePhone,
      payload.contact,
    ) ?? deepFindString(payload, PHONE_KEYS)
  const role = deepFindString(payload, ROLE_KEYS) ?? ''
  const farms = (deepFindRecordArray(payload, FARMS_KEYS) ?? []).map(normalizeAuthFarm)
  const leadFarm = farms[0]
  const farmAddress = pickString(
    leadFarm?.address,
    deepFindString(leadFarm, FARM_ADDRESS_KEYS),
    deepFindString(payload, FARM_ADDRESS_KEYS),
  )
  const farmLatitude = pickNumber(
    leadFarm?.latitude,
    deepFindString(leadFarm, FARM_LATITUDE_KEYS),
    deepFindString(payload, FARM_LATITUDE_KEYS),
  )
  const farmLongitude = pickNumber(
    leadFarm?.longitude,
    deepFindString(leadFarm, FARM_LONGITUDE_KEYS),
    deepFindString(payload, FARM_LONGITUDE_KEYS),
  )
  const ipcamAddress = pickString(
    leadFarm?.ipcamAddress,
    deepFindString(leadFarm, FARM_IPCAM_KEYS),
    deepFindString(payload, FARM_IPCAM_KEYS),
  )

  if (!accessToken || !refreshToken) {
    throw new Error('[auth] missing token fields in authenticate response')
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    username,
    name,
    phone,
    role,
    farms,
    farmAddress,
    farmLatitude,
    farmLongitude,
    ipcamAddress,
  }
}

export async function authenticate(payload: AuthenticationReq): Promise<AuthenticationRes> {
  const raw = await callApi<unknown, AuthenticationReq>({
    ...API_REQUESTS.auth.authenticate,
    data: payload,
  })

  const data = normalizeAuthenticationResponse(raw, payload.username)
  return data
}

export async function refreshToken(): Promise<AuthenticationRes> {
  const raw = await callApi<unknown>({
    ...API_REQUESTS.auth.refreshToken,
  })

  const data = normalizeAuthenticationResponse(raw)
  return data
}
