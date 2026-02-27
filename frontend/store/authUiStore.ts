import type { AuthUiStore } from '@/types/stores'
import { create } from 'zustand'

const INITIAL_STATE = {
  loading: false,
  resettingStorage: false,
  initialLoading: true,
  loginError: '',
}

export const useAuthUiStore = create<AuthUiStore>((set) => ({
  ...INITIAL_STATE,
  setLoading: (value) => set({ loading: value }),
  setResettingStorage: (value) => set({ resettingStorage: value }),
  setInitialLoading: (value) => set({ initialLoading: value }),
  setLoginError: (value) => set({ loginError: value }),
  resetUiState: () => set({ ...INITIAL_STATE }),
}))
