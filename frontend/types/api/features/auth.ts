export interface AuthenticationReq {
  username: string
  password: string
  termsAccepted?: boolean
  privacyAccepted?: boolean
  policiesAccepted?: boolean
}

export type AuthRole = 'USER' | 'ADMIN' | 'LEADER' | string

export interface AuthFarm {
  farmId?: number
  farmName?: string
  address?: string
  latitude?: number
  longitude?: number
  ipcamAddress?: string
}

export interface AuthenticationRes {
  access_token: string
  refresh_token: string
  username?: string
  name?: string
  phone?: string
  role?: AuthRole
  farms?: AuthFarm[]
  farmAddress?: string
  farmLatitude?: number
  farmLongitude?: number
  ipcamAddress?: string
}
