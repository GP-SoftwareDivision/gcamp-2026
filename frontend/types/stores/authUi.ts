export interface AuthUiStore {
  loading: boolean
  resettingStorage: boolean
  initialLoading: boolean
  loginError: string

  setLoading: (value: boolean) => void
  setResettingStorage: (value: boolean) => void
  setInitialLoading: (value: boolean) => void
  setLoginError: (value: string) => void
  resetUiState: () => void
}

