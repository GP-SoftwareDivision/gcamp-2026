import { ScreenLoader } from '@/components/ui'
import { farmApi } from '@/services/api'
import { clearAuthSession, getAuthSession, hasAcceptedPolicies } from '@/services/storage/authStorage'
import { useCameraUiStore } from '@/store/cameraUiStore'
import { useSensorStore } from '@/store/sensorStore'
import { useUiPrefsStore } from '@/store/uiPrefsStore'
import type { InitialRoute } from '@/types/pages'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { isAxiosError } from 'axios'

export default function Index() {
  const [targetRoute, setTargetRoute] = useState<InitialRoute | null>(null)
  const setIpcamAddress = useCameraUiStore((state) => state.setIpcamAddress)
  const hydrateFarmFromSession = useSensorStore((state) => state.hydrateFarmFromSession)
  const setProfileName = useUiPrefsStore((state) => state.setProfileName)
  const setProfilePhone = useUiPrefsStore((state) => state.setProfilePhone)

  useEffect(() => {
    let mounted = true

    const resolveRoute = async () => {
      try {
        const acceptedPolicies = await hasAcceptedPolicies()
        if (!acceptedPolicies) {
          if (mounted) setTargetRoute('/(auth)/terms')
          return
        }

        const session = await getAuthSession()
        if (mounted) {
          if (session) {
            let profile = null
            try {
              profile = await farmApi.getMyFarmProfile()
            } catch (error) {
              if (isAxiosError(error)) {
                const status = error.response?.status
                if (status === 401 || status === 403) {
                  await clearAuthSession()
                  setIpcamAddress(undefined)
                  setTargetRoute('/(auth)/login')
                  return
                }
              }
            }
            const currentSession = await getAuthSession()
            const hasUsableAccessToken = Boolean(currentSession?.accessToken?.trim())

            if (!hasUsableAccessToken) {
              setIpcamAddress(undefined)
              setTargetRoute('/(auth)/login')
              return
            }

            setIpcamAddress(profile?.ipcamAddress)
            hydrateFarmFromSession({
              address: profile?.address,
              latitude: profile?.latitude,
              longitude: profile?.longitude,
            })
            setProfileName(profile?.name?.trim() || profile?.username?.trim() || '-')
            setProfilePhone(profile?.phone?.trim() || '-')
          } else {
            setIpcamAddress(undefined)
          }
          setTargetRoute(session ? '/(tabs)/home' : '/(auth)/login')
        }
      } catch {
        if (mounted) setTargetRoute('/(auth)/login')
      }
    }

    resolveRoute()

    return () => {
      mounted = false
    }
  }, [hydrateFarmFromSession, setIpcamAddress, setProfileName, setProfilePhone])

  if (!targetRoute) {
    return (
      <SafeAreaView className='flex-1 bg-background dark:bg-background-dark'>
        <ScreenLoader size='small' />
      </SafeAreaView>
    )
  }

  return <Redirect href={targetRoute} />
}

