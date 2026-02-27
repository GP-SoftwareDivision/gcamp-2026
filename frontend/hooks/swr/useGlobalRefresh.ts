import { useSWRConfig } from 'swr'

export function useGlobalRefresh() {
  const { mutate } = useSWRConfig()

  const refreshAll = async () => {
    await mutate(() => true, undefined, { revalidate: true })
  }

  const refreshByPrefix = async (prefix: string) => {
    await mutate(
      (key) => Array.isArray(key) && typeof key[0] === 'string' && key[0] === prefix,
      undefined,
      { revalidate: true }
    )
  }

  return { refreshAll, refreshByPrefix }
}

