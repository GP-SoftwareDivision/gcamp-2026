import { callApi } from '../../core'
import { API_REQUESTS } from '../../contracts'
import type { WeatherRequestDto, WeatherResponse } from './types'

export async function getWeather(params: WeatherRequestDto): Promise<WeatherResponse> {
  return callApi<WeatherResponse, never, WeatherRequestDto>({
    ...API_REQUESTS.weather.getWeather,
    params,
  })
}
