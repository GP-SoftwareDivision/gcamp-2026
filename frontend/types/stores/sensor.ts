import type { SensorChartData, SensorUnitMap, SensorValueMap, WeatherCardData } from '@/types/domain'

export type SensorData = SensorChartData
export type CurrentValues = SensorValueMap
export type SensorUnits = SensorUnitMap
export type WeatherSnapshot = WeatherCardData

export interface FarmLocationState {
  address: string
  latitude: number | null
  longitude: number | null
}

export interface SensorStore {
  sensorData: Record<string, Record<string, SensorData>>
  farmAddress: string
  farmLatitude: number | null
  farmLongitude: number | null
  weatherDefaultLatitude: number | null
  weatherDefaultLongitude: number | null
  homeWeatherCache: WeatherSnapshot | null
  hasHomeBootstrapped: boolean
  farmInfoRequestInFlight: Promise<void> | null

  setSensorData: (sensorId: string, period: string, data: SensorData) => void
  getSensorData: (sensorId: string, period: string) => SensorData | null
  setFarmInfoFromApi: (farmRaw: unknown) => void
  hydrateFarmFromSession: (farm: {
    address?: string
    latitude?: number
    longitude?: number
  }) => void
  setWeatherDefaultCoords: (coords: { lat: number; lon: number }) => void
  setHomeWeatherCache: (weather: WeatherSnapshot | null) => void
  setHasHomeBootstrapped: (value: boolean) => void
  fetchFarmInfo: (options?: { force?: boolean }) => Promise<void>
}
