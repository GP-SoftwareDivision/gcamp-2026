export interface MarketSearchStore {
  startDate: string
  endDate: string
  itemCode: string | null
  grade: string | null
  unitName: string | null
  setStartDate: (value: string) => void
  setEndDate: (value: string) => void
  setItemCode: (value: string | null) => void
  setGrade: (value: string | null) => void
  setUnitName: (value: string | null) => void
  resetSearch: () => void
}
