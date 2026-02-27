import type { CommonResultDto } from '@/types/api'

export function isCommonResultDto<T>(value: unknown): value is CommonResultDto<T> {
  return typeof value === 'object' && value !== null && 'result' in value
}

export function unwrapCommonResult<T>(value: T | CommonResultDto<T>): T {
  return isCommonResultDto<T>(value) ? value.result : value
}
