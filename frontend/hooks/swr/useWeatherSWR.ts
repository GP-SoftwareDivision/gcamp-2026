import { weatherApi } from '@/services/api'
import useSWR from 'swr'

type WeatherKey = readonly ['weather', number, number]

export function useWeatherSWR(lat?: number | null, lon?: number | null) {
  const hasValidCoords =
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lon === 'number' &&
    Number.isFinite(lon)

  const key: WeatherKey | null = hasValidCoords ? ['weather', lat, lon] : null

  return useSWR(
    key,
    async ([, nextLat, nextLon]) => {
      console.log('[weatherApi.getWeather] lat/lon', { lat: nextLat, lon: nextLon })
      return weatherApi.getWeather({
        lat: nextLat,
        lon: nextLon,
        exclude: 'minutely,hourly,daily,alerts',
      })
    },
    {
      revalidateOnFocus: true,
    }
  )
}
