export type SensorValueMap = Record<string, number>
export type SensorUnitMap = Record<string, string>

export type SensorChartData = {
  labels: string[]
  myFarm: number[]
  leadFarm: number[]
}

export type WeatherCardData = {
  location: string
  temp: number
  humidity: number
  condition: string
  pop: number
  precipitation: number
  windSpeed: number
  icon: string
}
