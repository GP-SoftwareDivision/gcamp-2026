import { create } from 'zustand'

type SummaryPeriod = 'daily' | 'weekly' | 'monthly'

type UiPrefsStore = {
  showLeader: boolean
  showMyFarm: boolean
  selectedSensorPeriod: SummaryPeriod
  profileName: string
  profilePhone: string
  setShowLeader: (value: boolean) => void
  setShowMyFarm: (value: boolean) => void
  setSelectedSensorPeriod: (value: SummaryPeriod) => void
  setProfileName: (value: string) => void
  setProfilePhone: (value: string) => void
}

const INITIAL_PROFILE_NAME = '-'
const INITIAL_PROFILE_PHONE = '-'

export const useUiPrefsStore = create<UiPrefsStore>((set) => ({
  showLeader: true,
  showMyFarm: true,
  selectedSensorPeriod: 'daily',
  profileName: INITIAL_PROFILE_NAME,
  profilePhone: INITIAL_PROFILE_PHONE,
  setShowLeader: (value) => set({ showLeader: value }),
  setShowMyFarm: (value) => set({ showMyFarm: value }),
  setSelectedSensorPeriod: (value) => set({ selectedSensorPeriod: value }),
  setProfileName: (value) =>
    set({
      profileName:
        typeof value === 'string' && value.trim().length > 0 ? value : INITIAL_PROFILE_NAME,
    }),
  setProfilePhone: (value) =>
    set({
      profilePhone:
        typeof value === 'string' && value.trim().length > 0 ? value : INITIAL_PROFILE_PHONE,
    }),
}))
