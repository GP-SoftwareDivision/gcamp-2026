import * as SecureStore from 'expo-secure-store'
import type { ConsentState, StoredAuthSession } from '@/types/storage'

const STORAGE_KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
  hasAcceptedTerms: 'auth_has_accepted_terms',
  hasAcceptedPrivacy: 'auth_has_accepted_privacy',
  hasAcceptedPolicies: 'auth_has_accepted_policies',
} as const

const LEGACY_STORAGE_KEYS = {
  userId: 'saved_user_id',
  password: 'saved_password',
  autoLogin: 'auto_login_token',
  termsAgreed: 'terms_agreed',
  username: 'auth_username',
  name: 'auth_name',
  phone: 'auth_phone',
  role: 'auth_role',
  farmAddress: 'auth_farm_address',
  farmLatitude: 'auth_farm_latitude',
  farmLongitude: 'auth_farm_longitude',
  ipcamAddress: 'auth_ipcam_address',
  mac: 'auth_mac',
} as const

type AuthSessionListener = (session: StoredAuthSession | null) => void

const authSessionListeners = new Set<AuthSessionListener>()

function notifyAuthSessionChanged(session: StoredAuthSession | null) {
  for (const listener of authSessionListeners) {
    listener(session)
  }
}

export function subscribeAuthSession(listener: AuthSessionListener): () => void {
  authSessionListeners.add(listener)
  return () => {
    authSessionListeners.delete(listener)
  }
}

export async function saveAuthSession(session: StoredAuthSession) {
  const accessToken = session.accessToken.trim()
  const refreshToken = session.refreshToken.trim()

  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, refreshToken),
  ])

  notifyAuthSessionChanged({ accessToken, refreshToken })
}

export async function getAuthSession(): Promise<StoredAuthSession | null> {
  const [accessTokenRaw, refreshTokenRaw] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.accessToken),
    SecureStore.getItemAsync(STORAGE_KEYS.refreshToken),
  ])

  const refreshToken = refreshTokenRaw?.trim()
  if (!refreshToken) return null

  const accessToken = accessTokenRaw?.trim() ?? ''

  return { accessToken, refreshToken }
}

export async function clearAuthSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken),
    SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken),
    ...Object.values(LEGACY_STORAGE_KEYS).map((key) => SecureStore.deleteItemAsync(key)),
  ])

  notifyAuthSessionChanged(null)
}

export async function setTermsAccepted(accepted: boolean) {
  await SecureStore.setItemAsync(STORAGE_KEYS.hasAcceptedTerms, accepted ? '1' : '0')
}

export async function setPrivacyAccepted(accepted: boolean) {
  await SecureStore.setItemAsync(STORAGE_KEYS.hasAcceptedPrivacy, accepted ? '1' : '0')
}

export async function setPoliciesAccepted(accepted: boolean) {
  await SecureStore.setItemAsync(STORAGE_KEYS.hasAcceptedPolicies, accepted ? '1' : '0')
}

export async function getConsentState(): Promise<ConsentState> {
  const [termsRaw, privacyRaw, policiesRaw] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.hasAcceptedTerms),
    SecureStore.getItemAsync(STORAGE_KEYS.hasAcceptedPrivacy),
    SecureStore.getItemAsync(STORAGE_KEYS.hasAcceptedPolicies),
  ])

  return {
    termsAccepted: termsRaw === '1',
    privacyAccepted: privacyRaw === '1',
    policiesAccepted: policiesRaw === '1',
  }
}

export async function hasAcceptedPolicies(): Promise<boolean> {
  const { policiesAccepted } = await getConsentState()
  return policiesAccepted
}

export async function resetAuthStorageForRetest() {
  await Promise.all([
    clearAuthSession(),
    SecureStore.deleteItemAsync(STORAGE_KEYS.hasAcceptedTerms),
    SecureStore.deleteItemAsync(STORAGE_KEYS.hasAcceptedPrivacy),
    SecureStore.deleteItemAsync(STORAGE_KEYS.hasAcceptedPolicies),
  ])
}
