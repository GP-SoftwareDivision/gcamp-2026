import { useMarketStore } from '@/store/marketStore'
import useSWR from 'swr'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

function getKstDateKey(nowMs = Date.now()): string {
  const date = new Date(nowMs + KST_OFFSET_MS)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export function useMarketRecentlySWR() {
  const dateKey = getKstDateKey()

  return useSWR(
    ['market', 'recentlyPrices', dateKey],
    async () => useMarketStore.getState().fetchRecentlyPrices({ force: true }),
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10 * 60 * 1000,
      dedupingInterval: 10_000,
    }
  )
}

