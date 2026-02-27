export type MarketChartPoint = {
  mmdd: string
  label: string
  currentPrice: number | null
  lastYearAvgPrice: number | null
  threeYearAvgPrice: number | null
}

export type MarketChartData = {
  today: string
  itemCode: string
  itemName: string
  unitName: string
  gradeName: string
  points: MarketChartPoint[]
}

export type DatedPoint = MarketChartPoint & { date: Date }
