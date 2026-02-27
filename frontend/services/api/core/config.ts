const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL

export const API_BASE_URL = rawApiBaseUrl?.trim().replace(/\/+$/, '') ?? ''

export function getRequiredApiBaseUrl(context: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      `[api] base url is not configured (${context}). Set EXPO_PUBLIC_API_URL or EXPO_PUBLIC_API_BASE_URL.`,
    )
  }

  return API_BASE_URL
}
