export type FarmResponse = Record<string, unknown>

export type FarmMeProfile = {
  farmId?: number
  farmName?: string
  username?: string
  name?: string
  phone?: string
  role?: string
  address?: string
  latitude?: number
  longitude?: number
  ipcamAddress?: string
  mac?: string
}
