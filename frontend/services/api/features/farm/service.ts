import { callApi } from '../../core'
import { API_REQUESTS } from '../../contracts'
import type { FarmMeProfile, FarmResponse } from './types'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

function pickProfileRow(raw: unknown): Record<string, unknown> | null {
  const root = asRecord(raw)
  if (!root) return null

  const dataRows = asRecordArray(root.data)
  if (dataRows.length > 0) return dataRows[0]

  const resultRows = asRecordArray(root.result)
  if (resultRows.length > 0) return resultRows[0]

  const dataRecord = asRecord(root.data)
  if (dataRecord) {
    const nestedRows = asRecordArray(dataRecord.data)
    if (nestedRows.length > 0) return nestedRows[0]
  }

  return null
}

export function normalizeMyFarmProfile(raw: unknown): FarmMeProfile | null {
  const row = pickProfileRow(raw)
  if (!row) return null

  return {
    farmId: readNumber(row.farmId),
    farmName: readString(row.farmName),
    username: readString(row.username),
    name: readString(row.name),
    phone: readString(row.phone),
    role: readString(row.role),
    address: readString(row.address),
    latitude: readNumber(row.latitude),
    longitude: readNumber(row.longitude),
    ipcamAddress: readString(row.ipcamAddress),
    mac: readString(row.mac),
  }
}

export async function getMyFarmInfo(): Promise<FarmResponse> {
  return callApi<FarmResponse>({
    ...API_REQUESTS.farm.getMyFarmInfo,
    unwrapResult: false,
  })
}

export async function getMyFarmProfile(): Promise<FarmMeProfile | null> {
  const raw = await getMyFarmInfo()
  return normalizeMyFarmProfile(raw)
}

