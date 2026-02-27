import { farmApi } from '@/services/api'
import type {
  CurrentValues,
  FarmLocationState,
  SensorStore,
  SensorUnits,
  WeatherSnapshot,
} from '@/types/stores'
import { create } from 'zustand'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function toFiniteEnvNumber(value: string | undefined): number | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function toObjectRows(value: unknown): Record<string, unknown>[] | null {
  const parsed = tryParseJson(value)
  if (Array.isArray(parsed)) {
    return parsed.filter((item) => typeof item === 'object' && item !== null) as Record<string, unknown>[]
  }

  const record = asRecord(parsed)
  if (!record) return null

  const farmsValue = record.farms
  if (Array.isArray(farmsValue)) {
    const farmRows = farmsValue
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null)
    if (farmRows.length > 0) return farmRows
  }

  const isFarmLike =
    'farmId' in record ||
    'farmName' in record ||
    'address' in record ||
    'latitude' in record ||
    'longitude' in record ||
    'lat' in record ||
    'lon' in record

  return isFarmLike ? [record] : null
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function extractFarmRows(raw: unknown): Record<string, unknown>[] {
  const normalizedRaw = tryParseJson(raw)
  const directRows = toObjectRows(normalizedRaw)
  if (directRows && directRows.length > 0) return directRows

  const root = asRecord(normalizedRaw)
  if (!root || root.success === false) return []

  const rootData = asRecord(tryParseJson(root.data))
  const rootResult = asRecord(tryParseJson(root.result))
  const candidates: unknown[] = [
    root.data,
    root.result,
    rootData?.result,
    rootResult?.data,
    rootData?.data,
    rootResult?.result,
  ]

  for (const candidate of candidates) {
    const rows = toObjectRows(candidate)
    if (rows && rows.length > 0) return rows
  }

  return []
}

function rowsToFarmLocation(rows: Record<string, unknown>[]): FarmLocationState {
  const first = rows.find((row) => typeof row === 'object' && row !== null)
  if (!first) {
    return { address: '-', latitude: null, longitude: null }
  }

  const address = toNonEmptyString(first.address) ?? '-'
  const latitude = toNumber(first.latitude) ?? toNumber(first.lat) ?? null
  const longitude = toNumber(first.longitude) ?? toNumber(first.lon) ?? null

  return { address, latitude, longitude }
}

function toNullableFinite(value: number | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

export const EMPTY_SENSOR_VALUE_MAP: CurrentValues = {}
export const EMPTY_SENSOR_UNIT_MAP: SensorUnits = {}
export const EMPTY_LEAD_SENSOR_VALUE_MAP: CurrentValues = {}
export const EMPTY_LEAD_SENSOR_UNIT_MAP: SensorUnits = {}
export const UNKNOWN_FARM_ADDRESS = '-'
export const DEFAULT_CURRENT_VALUES = EMPTY_SENSOR_VALUE_MAP
export const DEFAULT_CURRENT_UNITS = EMPTY_SENSOR_UNIT_MAP
export const DEFAULT_LEAD_FARM_VALUES = EMPTY_LEAD_SENSOR_VALUE_MAP
export const DEFAULT_LEAD_FARM_UNITS = EMPTY_LEAD_SENSOR_UNIT_MAP
export const DEFAULT_FARM_ADDRESS = UNKNOWN_FARM_ADDRESS
export const EMPTY_WEATHER_SNAPSHOT: WeatherSnapshot = {
  location: '-',
  temp: Number.NaN,
  humidity: Number.NaN,
  condition: '-',
  pop: Number.NaN,
  precipitation: Number.NaN,
  windSpeed: Number.NaN,
  icon: '',
}
export const DEFAULT_WEATHER_COORDS = {
  lat: toFiniteEnvNumber(process.env.EXPO_PUBLIC_WEATHER_LAT),
  lon: toFiniteEnvNumber(process.env.EXPO_PUBLIC_WEATHER_LON),
}

export const useSensorStore = create<SensorStore>((set, get) => ({
  sensorData: {},
  farmAddress: UNKNOWN_FARM_ADDRESS,
  farmLatitude: null,
  farmLongitude: null,
  weatherDefaultLatitude: DEFAULT_WEATHER_COORDS.lat,
  weatherDefaultLongitude: DEFAULT_WEATHER_COORDS.lon,
  homeWeatherCache: null,
  hasHomeBootstrapped: false,
  farmInfoRequestInFlight: null,

  setSensorData: (sensorId, period, data) => {
    set((state) => ({
      sensorData: {
        ...state.sensorData,
        [sensorId]: {
          ...state.sensorData[sensorId],
          [period]: data,
        },
      },
    }))
  },

  getSensorData: (sensorId, period) => {
    return get().sensorData[sensorId]?.[period] || null
  },

  setFarmInfoFromApi: (farmRaw) => {
    set((state) => {
      const farmRows = extractFarmRows(farmRaw)
      if (!farmRows.length) {
        return state
      }

      const parsed = rowsToFarmLocation(farmRows)
      return {
        farmAddress: parsed.address || state.farmAddress,
        farmLatitude: parsed.latitude ?? state.farmLatitude,
        farmLongitude: parsed.longitude ?? state.farmLongitude,
        weatherDefaultLatitude: parsed.latitude ?? state.weatherDefaultLatitude,
        weatherDefaultLongitude: parsed.longitude ?? state.weatherDefaultLongitude,
      }
    })
  },

  hydrateFarmFromSession: (farm) => {
    set((state) => {
      const address = toNonEmptyString(farm.address)
      const latitude = toNullableFinite(farm.latitude)
      const longitude = toNullableFinite(farm.longitude)

      return {
        farmAddress: address ?? state.farmAddress,
        farmLatitude: latitude ?? state.farmLatitude,
        farmLongitude: longitude ?? state.farmLongitude,
        weatherDefaultLatitude: latitude ?? state.weatherDefaultLatitude,
        weatherDefaultLongitude: longitude ?? state.weatherDefaultLongitude,
      }
    })
  },

  setWeatherDefaultCoords: ({ lat, lon }) => {
    set((state) => ({
      weatherDefaultLatitude: Number.isFinite(lat) ? lat : state.weatherDefaultLatitude,
      weatherDefaultLongitude: Number.isFinite(lon) ? lon : state.weatherDefaultLongitude,
    }))
  },

  setHomeWeatherCache: (weather) => {
    set({ homeWeatherCache: weather })
  },

  setHasHomeBootstrapped: (value) => {
    set({ hasHomeBootstrapped: value })
  },

  fetchFarmInfo: async (options) => {
    const force = options?.force === true
    const state = get()
    const hasAddress = state.farmAddress !== UNKNOWN_FARM_ADDRESS
    const hasCoords = state.farmLatitude !== null && state.farmLongitude !== null

    if (!force && hasAddress && hasCoords) {
      return
    }

    if (state.farmInfoRequestInFlight) {
      await state.farmInfoRequestInFlight
      return
    }

    const request = (async () => {
      try {
        const result = await farmApi.getMyFarmInfo()
        get().setFarmInfoFromApi(result)
      } catch {
        // Keep previous state when request fails.
      }
    })()
    set({ farmInfoRequestInFlight: request })

    try {
      await request
    } finally {
      if (get().farmInfoRequestInFlight === request) {
        set({ farmInfoRequestInFlight: null })
      }
    }
  },
}))
