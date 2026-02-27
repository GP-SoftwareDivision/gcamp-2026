import { AnimatedValueText, Card, ScreenLoader, ScreenScroll, SectionHeader, TabHeader } from '@/components/ui'
import { farmApi } from '@/services/api'
import { useFarmSensors, useWeatherSWR } from '@/hooks/swr'
import { useTheme } from '@/hooks/theme'
import {
  EMPTY_WEATHER_SNAPSHOT,
  UNKNOWN_FARM_ADDRESS,
  useSensorStore,
} from '@/store/sensorStore'
import { getCardBaseStyle, sectionStyles } from '@/styles/cardStyles'
import type { WeatherCardData } from '@/types/domain'
import type { SensorItem } from '@/types/pages'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Cloud, CloudRain, Droplets, Wind } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SENSOR_ITEMS: SensorItem[] = [
  { id: 'temperature', label: '온도', fallbackUnit: '°C' },
  { id: 'humidity', label: '습도', fallbackUnit: '%' },
  { id: 'carbondioxide', label: 'CO2', fallbackUnit: 'ppm' },
  { id: 'insolation', label: '광량', fallbackUnit: 'W/m²' },
  { id: 'ec', label: 'EC', fallbackUnit: 'dS/m' },
  { id: 'hydrogenIon', label: 'pH', fallbackUnit: 'pH' },
  { id: 'soilTemperature', label: '근권 온도', fallbackUnit: '°C' },
  { id: 'soilWater', label: '근권 습도', fallbackUnit: '%' },
]
const EMPTY_WEATHER: WeatherCardData = EMPTY_WEATHER_SNAPSHOT

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeLocation(value: string | undefined): string {
  if (!value) return '-'

  const trimmed = value.trim()
  if (!trimmed) return '-'

  const tail = trimmed.includes('/') ? (trimmed.split('/').pop() ?? trimmed) : trimmed
  return tail.replace(/_/g, ' ')
}

function readNumberFromRecord(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = readNumber(record[key])
    if (value !== undefined) return value
  }
  return undefined
}

function normalizePopPercent(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined
  if (value >= 0 && value <= 1) return value * 100
  return value
}

function parseWeatherResponse(raw: unknown): WeatherCardData | null {
  const root = asRecord(raw)
  if (!root) return null

  const rootData = asRecord(root.data)
  const rootResult = asRecord(root.result)
  const rootDataResult = asRecord(rootData?.result)
  const rootResultData = asRecord(rootResult?.data)

  const candidates = [root, rootData, rootResult, rootDataResult, rootResultData].filter(
    (candidate): candidate is Record<string, unknown> => candidate !== null,
  )

  for (const candidate of candidates) {
    const current = asRecord(candidate.current)
    if (!current) continue

    const weatherItems = Array.isArray(current.weather) ? current.weather : []
    const firstWeather = asRecord(weatherItems[0])
    const rawPop = readNumberFromRecord(current, ['pop', 'rainProb', 'precipitationProbability'])
    const popPercent = normalizePopPercent(rawPop)
    const precipitation = readNumberFromRecord(current, ['precipitation'])

    return {
      location: normalizeLocation(readString(candidate.name) ?? readString(candidate.timezone)),
      temp: readNumberFromRecord(current, ['temp', 'temperature']) ?? Number.NaN,
      humidity: readNumber(current.humidity) ?? Number.NaN,
      condition:
        readString(firstWeather?.description) ??
        readString(firstWeather?.main) ??
        readString(current.weatherDescription) ??
        '-',
      pop: popPercent ?? Number.NaN,
      precipitation: precipitation ?? Number.NaN,
      windSpeed: readNumberFromRecord(current, ['windSpeed', 'wind_speed']) ?? Number.NaN,
      icon: readString(firstWeather?.icon) ?? '',
    }
  }

  return null
}

function formatSensorValue(sensorId: string, value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (sensorId === 'carbondioxide' || sensorId === 'insolation') return String(Math.round(value))
  if (sensorId === 'humidity' || sensorId === 'soilWater') return String(Math.round(value))
  if (sensorId === 'ec') return (value / 1000).toFixed(2).replace(/\.?0+$/, '')
  if (sensorId === 'hydrogenIon') return value.toFixed(1)
  return value.toFixed(1)
}

export default function HomeScreen() {
  const { isDark } = useTheme()
  const fetchFarmInfo = useSensorStore((state) => state.fetchFarmInfo)
  const hydrateFarmFromSession = useSensorStore((state) => state.hydrateFarmFromSession)
  const farmAddress = useSensorStore((state) => state.farmAddress)
  const farmLatitude = useSensorStore((state) => state.farmLatitude)
  const farmLongitude = useSensorStore((state) => state.farmLongitude)
  const weatherDefaultLatitude = useSensorStore((state) => state.weatherDefaultLatitude)
  const weatherDefaultLongitude = useSensorStore((state) => state.weatherDefaultLongitude)
  const weatherCache = useSensorStore((state) => state.homeWeatherCache)
  const setHomeWeatherCache = useSensorStore((state) => state.setHomeWeatherCache)
  const hasHomeBootstrapped = useSensorStore((state) => state.hasHomeBootstrapped)
  const setHasHomeBootstrapped = useSensorStore((state) => state.setHasHomeBootstrapped)
  const {
    data: farmSensorsData,
    mutate: revalidateFarmSensors,
  } = useFarmSensors()
  const weatherLat =
    typeof farmLatitude === 'number' && Number.isFinite(farmLatitude)
      ? farmLatitude
      : weatherDefaultLatitude
  const weatherLon =
    typeof farmLongitude === 'number' && Number.isFinite(farmLongitude)
      ? farmLongitude
      : weatherDefaultLongitude
  const { data: weatherRaw, mutate: revalidateWeather } = useWeatherSWR(weatherLat, weatherLon)
  const currentValues = farmSensorsData?.currentValues ?? {}
  const currentUnits = farmSensorsData?.currentUnits ?? {}

  const [userName, setUserName] = useState('-')
  const [isInitialLoading, setIsInitialLoading] = useState(() => !hasHomeBootstrapped)

  const handleRefetch = async () => {
    await Promise.all([
      fetchFarmInfo({ force: true }),
      revalidateFarmSensors(),
      revalidateWeather(),
    ])
  }

  useEffect(() => {
    if (!weatherRaw) return
    const parsed = parseWeatherResponse(weatherRaw)
    if (!parsed) return

    const normalizedFarmAddress = readString(farmAddress)
    const location =
      normalizedFarmAddress && normalizedFarmAddress !== UNKNOWN_FARM_ADDRESS
        ? normalizedFarmAddress
        : parsed.location
    const nextWeather = { ...parsed, location }

    setHomeWeatherCache(nextWeather)
  }, [farmAddress, setHomeWeatherCache, weatherRaw])

  useEffect(() => {
    let mounted = true

    const loadUserName = async () => {
      try {
        const profile = await farmApi.getMyFarmProfile()
        if (!mounted) return

        const name = profile?.name?.trim()
        const username = profile?.username?.trim()
        hydrateFarmFromSession({
          address: profile?.address,
          latitude: profile?.latitude,
          longitude: profile?.longitude,
        })
        setUserName(name || username || '-')
      } catch {
        if (mounted) setUserName('-')
      }
    }

    loadUserName().catch(() => {
      if (mounted) setUserName('-')
    })

    return () => {
      mounted = false
    }
  }, [hydrateFarmFromSession])

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        const snapshot = useSensorStore.getState()
        const hasFarmLocation =
          snapshot.farmAddress !== UNKNOWN_FARM_ADDRESS &&
          snapshot.farmLatitude !== null &&
          snapshot.farmLongitude !== null
        const needsBootstrap = !hasHomeBootstrapped || !hasFarmLocation

        if (needsBootstrap) {
          await Promise.all([
            fetchFarmInfo({ force: !hasFarmLocation }),
            revalidateFarmSensors(),
            revalidateWeather(),
          ])
          setHasHomeBootstrapped(true)
        }
      } finally {
        if (mounted) setIsInitialLoading(false)
      }
    }

    bootstrap().catch(() => {
      if (mounted) setIsInitialLoading(false)
    })

    return () => {
      mounted = false
    }
  }, [
    fetchFarmInfo,
    hasHomeBootstrapped,
    revalidateFarmSensors,
    revalidateWeather,
    setHasHomeBootstrapped,
  ])

  const parsedWeather = weatherRaw ? parseWeatherResponse(weatherRaw) : null
  const normalizedFarmAddress = readString(farmAddress)
  const weather: WeatherCardData = parsedWeather
    ? {
        ...parsedWeather,
        location:
          normalizedFarmAddress && normalizedFarmAddress !== UNKNOWN_FARM_ADDRESS
            ? normalizedFarmAddress
            : parsedWeather.location,
      }
    : weatherCache ?? EMPTY_WEATHER

  if (isInitialLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
        <ScreenLoader />
      </SafeAreaView>
    )
  }

  const displayTemp = Number.isFinite(weather.temp) ? String(weather.temp) + '°C' : '0°C'
  const precipitationValue = Number.isFinite(weather.pop)
    ? Math.max(0, weather.pop)
    : Number.isFinite(weather.precipitation)
      ? Math.max(0, weather.precipitation)
      : 0
  const displayPrecipitation = `${Math.round(precipitationValue)}%`
  const displayHumidity = Number.isFinite(weather.humidity) ? `${weather.humidity}%` : '0%'
  const displayWindSpeed = Number.isFinite(weather.windSpeed) ? `${weather.windSpeed}m/s` : '0m/s'
  const displayUserName = userName !== '-' ? userName + ' 님' : '-'
  const weatherIconUrl = weather.icon
    ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
    : null

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
      <TabHeader title={displayUserName} />
      <ScreenScroll
        className='flex-1'
        onRefetch={handleRefetch}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          className='mb-5 bg-card dark:bg-card-dark rounded-2xl'
          style={[getCardBaseStyle(isDark), styles.weatherCard]}
        >
          <View className='flex-row items-start justify-between'>
            <Text
              className='flex-1 mr-2 text-subhead text-content-secondary dark:text-content-dark-secondary'
              numberOfLines={2}
              ellipsizeMode='tail'
            >
              {weather.location}
            </Text>
            <Text className='shrink-0 text-subhead text-content-secondary dark:text-content-dark-secondary'>
              {weather.condition}
            </Text>
          </View>

          <View className='flex-row items-center justify-between'>
            <Text className='text-display text-content dark:text-content-dark'>{displayTemp}</Text>
            {weatherIconUrl ? (
              <Image
                source={{ uri: weatherIconUrl }}
                style={styles.weatherIcon}
                contentFit='contain'
              />
            ) : (
              <Cloud size={38} color={isDark ? '#C5C5C5' : '#1C1C1E'} strokeWidth={1.3} />
            )}
          </View>

          <View className='mt-1.5 flex-row border-t border-black/5 pt-1.5 dark:border-white/10'>
            <View className='flex-1 flex-row items-center justify-center gap-1.5'>
              <CloudRain size={18} color={isDark ? '#C5C5C5' : '#1C1C1E'} strokeWidth={1.5} />
              <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                {displayPrecipitation}
              </Text>
            </View>
            <View className='flex-1 flex-row items-center justify-center gap-1.5'>
              <Droplets size={18} color={isDark ? '#C5C5C5' : '#1C1C1E'} strokeWidth={1.5} />
              <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                {displayHumidity}
              </Text>
            </View>
            <View className='flex-1 flex-row items-center justify-center gap-1.5'>
              <Wind size={18} color={isDark ? '#C5C5C5' : '#1C1C1E'} strokeWidth={1.5} />
              <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
                {displayWindSpeed}
              </Text>
            </View>
          </View>
        </View>

        <SectionHeader
          title='나의 농장'
          action={{ label: '비교 분석', onPress: () => router.push('/(tabs)/home/compare') }}
        />

        {[0, 2, 4, 6].map((rowStart) => (
          <View key={rowStart} className='flex-row gap-3 mb-5'>
            {SENSOR_ITEMS.slice(rowStart, rowStart + 2).map((item) => {
              const value = currentValues[item.id] ?? 0
              const unit = item.id === 'ec' ? 'dS/m' : (currentUnits[item.id] ?? item.fallbackUnit)
              const sensorType = String(item.id)

              return (
                <Card
                  key={item.id}
                  className='flex-1'
                  label={item.label}
                  onPress={() => {
                    const nextParams = { id: sensorType, type: sensorType }
                    router.push({
                      pathname: '/(tabs)/home/sensor/[id]',
                      params: nextParams,
                    })
                  }}
                >
                  <View className='flex-row items-end'>
                    <AnimatedValueText
                      value={value}
                      className='font-medium text-content dark:text-content-dark text-[28px]'
                      format={(nextValue) => formatSensorValue(item.id, nextValue)}
                      duration={650}
                    />
                    <Text className='ml-1 text-base font-normal text-content-secondary dark:text-content-dark-secondary'>
                      {unit ?? ''}
                    </Text>
                  </View>
                </Card>
              )
            })}
          </View>
        ))}

        <View className='mb-5' />
      </ScreenScroll>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: sectionStyles.paddingHorizontal,
    paddingBottom: sectionStyles.scrollBottomPadding,
  },
  weatherIcon: {
    width: 64,
    height: 64,
  },
  weatherCard: {
    paddingHorizontal: sectionStyles.paddingHorizontal,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: sectionStyles.blockMarginBottom,
  },
})

