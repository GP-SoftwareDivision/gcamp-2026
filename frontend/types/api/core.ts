import type { Method } from 'axios'

export interface CommonResultDto<T> {
  result: T
}

export interface ApiCallOptions<TBody = unknown, TParams = unknown> {
  feature: string
  action: string
  method: Method
  url: string
  timeoutMs?: number
  data?: TBody
  params?: TParams
  headers?: Record<string, string>
  includeAuth?: boolean
  unwrapResult?: boolean
}

