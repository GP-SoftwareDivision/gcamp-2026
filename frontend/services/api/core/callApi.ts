import { getAuthSession, saveAuthSession } from '../../storage/authStorage'
import type { ApiCallOptions, CommonResultDto } from '@/types/api'
import { getRequiredApiBaseUrl } from './config'
import { httpClient } from './httpClient'
import { unwrapCommonResult } from './response'
import { isAxiosError } from 'axios'

const ACCESS_TOKEN_KEYS = ['access_token', 'accessToken', 'token', 'jwt', 'id_token', 'idToken']
const REFRESH_TOKEN_KEYS = ['refresh_token', 'refreshToken']

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function pickString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function deepFindString(source: unknown, keys: string[], depth = 0): string | undefined {
  if (depth > 5) return undefined

  const direct = pickString(source)
  if (direct) return direct

  if (Array.isArray(source)) {
    for (const item of source) {
      const nested = deepFindString(item, keys, depth + 1)
      if (nested) return nested
    }
    return undefined
  }

  const record = asRecord(source)
  if (!record) return undefined

  for (const key of keys) {
    const value = pickString(record[key])
    if (value) return value
  }

  for (const value of Object.values(record)) {
    const nested = deepFindString(value, keys, depth + 1)
    if (nested) return nested
  }

  return undefined
}

async function resolveAuthorizationHeader(includeAuth: boolean): Promise<string | undefined> {
  if (!includeAuth) return undefined

  const session = await getAuthSession()
  const accessToken = session?.accessToken?.trim()
  if (!accessToken && session?.refreshToken) {
    const refreshedAccessToken = await tryRefreshAccessToken()
    if (refreshedAccessToken) return `Bearer ${refreshedAccessToken}`
    return undefined
  }
  if (!accessToken) return undefined

  return `Bearer ${accessToken}`
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const session = await getAuthSession()
  if (!session?.refreshToken) return null

  try {
    const response = await httpClient.request<unknown>({
      method: 'POST',
      url: '/auth/refresh-token',
      headers: {
        Authorization: `Bearer ${session.refreshToken}`,
      },
      data: {
        refreshToken: session.refreshToken,
        refresh_token: session.refreshToken,
      },
    })

    const accessToken = deepFindString(response.data, ACCESS_TOKEN_KEYS)
    if (!accessToken) return null

    const refreshToken = deepFindString(response.data, REFRESH_TOKEN_KEYS) ?? session.refreshToken

    await saveAuthSession({
      accessToken,
      refreshToken,
      username: session.username,
      name: session.name,
      phone: session.phone,
      role: session.role,
      farmAddress: session.farmAddress,
      farmLatitude: session.farmLatitude,
      farmLongitude: session.farmLongitude,
      ipcamAddress: session.ipcamAddress,
      mac: session.mac,
    })

    return accessToken
  } catch {
    return null
  }
}

export async function callApi<TResponse, TBody = unknown, TParams = unknown>(
  options: ApiCallOptions<TBody, TParams>
): Promise<TResponse> {
  const {
    feature,
    action,
    method,
    url,
    timeoutMs,
    data,
    params,
    headers,
    includeAuth = feature !== 'auth',
    unwrapResult = true,
  } = options
  getRequiredApiBaseUrl(`${feature}.${action}`)
  const authorization = await resolveAuthorizationHeader(includeAuth)
  const requestHeaders = {
    ...(authorization ? { Authorization: authorization } : {}),
    ...headers,
  }
  const hasHeaders = Object.keys(requestHeaders).length > 0

  try {
    const response = await httpClient.request<TResponse | CommonResultDto<TResponse>>({
      method,
      url,
      timeout: timeoutMs,
      data,
      params,
      headers: hasHeaders ? requestHeaders : undefined,
    })

    const responseData = unwrapResult
      ? unwrapCommonResult<TResponse>(response.data)
      : (response.data as TResponse)

    return responseData
  } catch (error) {
    if (includeAuth && isAxiosError(error) && error.response?.status === 401) {
      const refreshedAccessToken = await tryRefreshAccessToken()
      if (refreshedAccessToken) {
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${refreshedAccessToken}`,
        }
        const retryHasHeaders = Object.keys(retryHeaders).length > 0

        const retryResponse = await httpClient.request<TResponse | CommonResultDto<TResponse>>({
          method,
          url,
          timeout: timeoutMs,
          data,
          params,
          headers: retryHasHeaders ? retryHeaders : undefined,
        })

        const retryData = unwrapResult
          ? unwrapCommonResult<TResponse>(retryResponse.data)
          : (retryResponse.data as TResponse)

        return retryData
      }
    }

    throw error
  }
}
