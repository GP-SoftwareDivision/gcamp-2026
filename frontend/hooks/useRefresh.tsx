import type { UseRefreshResult } from '@/types/hooks'
import { useState } from 'react'
import { RefreshControl } from 'react-native'

const TINT_COLOR = '#007AFF'

/**
 * Pull-to-refresh helper for scroll screens.
 */
export function useRefresh(onRefetch?: () => void | Promise<void>): UseRefreshResult {
  const [refreshing, setRefreshing] = useState(false)

  async function onRefresh() {
    setRefreshing(true)
    try {
      if (onRefetch) {
        await onRefetch()
      } else {
        await new Promise((r) => setTimeout(r, 800))
      }
    } finally {
      setRefreshing(false)
    }
  }

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT_COLOR} />
  )

  return { refreshing, onRefresh, refreshControl }
}
