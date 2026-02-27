import type { MarketSearchStore } from '@/types/stores'
import dayjs from 'dayjs'
import { create } from 'zustand'

function getDefaultStartDate(): string {
  return dayjs().subtract(1, 'month').format('YYYYMMDD')
}

function getDefaultEndDate(): string {
  return dayjs().format('YYYYMMDD')
}

export const useMarketSearchStore = create<MarketSearchStore>((set) => ({
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  itemCode: null,
  grade: null,
  unitName: null,
  setStartDate: (value) => set({ startDate: value }),
  setEndDate: (value) => set({ endDate: value }),
  setItemCode: (value) => set({ itemCode: value }),
  setGrade: (value) => set({ grade: value }),
  setUnitName: (value) => set({ unitName: value }),
  resetSearch: () =>
    set({
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate(),
      itemCode: null,
      grade: null,
      unitName: null,
    }),
}))
