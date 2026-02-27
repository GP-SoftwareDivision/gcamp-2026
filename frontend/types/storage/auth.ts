export interface StoredAuthSession {
  accessToken: string
  refreshToken: string
  username?: string
  name?: string
  phone?: string
  role?: string
  farmAddress?: string
  farmLatitude?: number
  farmLongitude?: number
  ipcamAddress?: string
  mac?: string
}

export interface ConsentState {
  termsAccepted: boolean
  privacyAccepted: boolean
  policiesAccepted: boolean
}
