import type { ComponentProps, ReactElement } from 'react'
import type { RefreshControl } from 'react-native'

export type RefreshControlProps = ComponentProps<typeof RefreshControl>

export interface UseRefreshResult {
  refreshing: boolean
  onRefresh: () => Promise<void>
  refreshControl: ReactElement<RefreshControlProps>
}

