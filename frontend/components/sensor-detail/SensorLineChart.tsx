import { CHART_HEIGHT, ChartColors, IS_ANDROID } from '@/constants/design'
import type { SensorLineChartProps } from '@/types/pages'
import { Dimensions, PixelRatio, Text, View, ActivityIndicator } from 'react-native'
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts/dist/LineChart'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export function SensorLineChart({ data, isDark, unit }: SensorLineChartProps) {
  if (data.labels.length === 0) {
    return (
      <View style={{ height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size='small' color={isDark ? '#E5E5EA' : '#636366'} />
      </View>
    )
  }

  const chartWidth = Math.max(SCREEN_WIDTH - 88, 220)
  const decimals = unit === 'dS/m' ? 2 : 0
  const lastIndex = data.labels.length - 1
  const isDaily = data.labels.every((label) => label.includes(':'))
  const isWeekly = data.labels.length === 7

  const shouldShowLabel = (index: number): boolean => {
    if (isWeekly) return true
    if (isDaily) {
      if (data.labels.length >= 16) return index % 4 === 0
      return index % 2 === 0
    }
    const step = Math.max(1, Math.round(lastIndex / 4))
    return index % step === 0
  }

  const yLabelWidth = 35
  const startPadding = 10
  const endPadding = 14
  const plotWidth = chartWidth - yLabelWidth - startPadding - endPadding
  const pointSpacing = plotWidth / (lastIndex || 1)
  const labelWidth = Math.max(pointSpacing, 40)
  const fontScale = IS_ANDROID ? PixelRatio.getFontScale() : 1
  const chartLabelFontSize = 10 / fontScale

  const myFarmData = data.myFarm.map((value, index) => ({
    value,
    label: shouldShowLabel(index) ? data.labels[index] : '',
    labelTextStyle: {
      color: '#8E8E93',
      fontSize: chartLabelFontSize,
      width: labelWidth,
      textAlign: 'center' as const,
    },
    hideDataPoint: index !== lastIndex,
  }))

  const leadFarmData = data.leadFarm.map((value, index) => ({
    value,
    hideDataPoint: index !== lastIndex,
  }))

  const allValues = [...data.myFarm, ...data.leadFarm].filter((value) => Number.isFinite(value))
  if (allValues.length === 0) {
    return (
      <View style={{ height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size='small' color={isDark ? '#E5E5EA' : '#636366'} />
      </View>
    )
  }

  const dataMin = Math.min(...allValues)
  const dataMax = Math.max(...allValues)
  const range = dataMax - dataMin
  const padding = Math.max(range * 0.3, 1)
  const minValue = Math.floor(dataMin - padding)
  const maxValue = Math.ceil(dataMax + padding)

  return (
    <View
      style={{
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <GiftedLineChart
        data={myFarmData}
        data2={leadFarmData.length > 0 ? leadFarmData : undefined}
        width={chartWidth}
        height={CHART_HEIGHT}
        spacing={pointSpacing}
        color1={ChartColors.seriesBlue}
        color2={ChartColors.seriesGreen}
        thickness={2.5}
        thickness2={2}
        dataPointsRadius={5}
        dataPointsColor1={ChartColors.seriesBlue}
        dataPointsColor2={ChartColors.seriesGreen}
        curved
        curvature={0.15}
        yAxisColor='transparent'
        xAxisColor={isDark ? '#48484A' : '#E5E5EA'}
        yAxisTextStyle={{ color: '#8E8E93', fontSize: chartLabelFontSize }}
        xAxisLabelTextStyle={{
          color: '#8E8E93',
          fontSize: chartLabelFontSize,
          width: labelWidth,
          textAlign: 'center',
        }}
        noOfSections={4}
        maxValue={maxValue - minValue}
        yAxisOffset={minValue}
        formatYLabel={(label: string) => parseFloat(label).toFixed(decimals)}
        rulesColor={isDark ? '#48484A' : '#E5E5EA'}
        rulesType='solid'
        initialSpacing={startPadding}
        endSpacing={endPadding}
        disableScroll
        isAnimated
        animationDuration={500}
        yAxisLabelWidth={yLabelWidth}
        pointerConfig={{
          showPointerStrip: true,
          activatePointersOnLongPress: false,
          activatePointersInstantlyOnTouch: true,
          pointerStripColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
          pointerColor: isDark ? '#FFFFFF' : '#1C1C1E',
          pointer1Color: isDark ? '#FFFFFF' : '#1C1C1E',
          pointer2Color: isDark ? '#FFFFFF' : '#1C1C1E',
          pointerLabelWidth: 170,
          pointerLabelHeight: 84,
          shiftPointerLabelY: 84,
          pointerLabelComponent: (
            items: { value?: number; label?: string } | { value?: number; label?: string }[],
          ) => {
            const list = Array.isArray(items) ? items : [items]
            const names = ['내 농가', '우수 농가']
            const rows = list.filter((item) => item?.value != null)
            if (rows.length === 0) return null

            return (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                }}
              >
                {rows.map((item, index) => (
                  <Text
                    key={index}
                    className='font-semibold text-caption-1 text-content dark:text-content-dark'
                    allowFontScaling={false}
                    style={{ fontSize: 15, lineHeight: 20 }}
                  >
                    {rows.length > 1 ? `${names[index] ?? ''}: ` : ''}
                    {item.value!.toFixed(decimals)}
                    {unit ? ` ${unit}` : ''}
                  </Text>
                ))}
              </View>
            )
          },
        }}
      />
    </View>
  )
}
