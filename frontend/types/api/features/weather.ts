export interface WeatherRequestDto {
  lat: number
  lon: number
  exclude?: string
}

export type WeatherResponse = Record<string, unknown>
