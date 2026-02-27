import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, ScreenLoader } from '@/components/ui'
import { authApi, farmApi } from '@/services/api'
import {
  clearAuthSession,
  getAuthSession,
  getConsentState,
  saveAuthSession,
} from '@/services/storage/authStorage'
import { loginSchema, type LoginFormValues } from '@/schemas/auth/login'
import { useAuthUiStore } from '@/store/authUiStore'
import { useCameraUiStore } from '@/store/cameraUiStore'
import { useSensorStore } from '@/store/sensorStore'
import { useUiPrefsStore } from '@/store/uiPrefsStore'
import { isAxiosError } from 'axios'
import { router } from 'expo-router'
import { Lock, User } from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Image,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function getLoginErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string' && message.trim().length > 0) return message

    const rawData = error.response?.data
    if (typeof rawData === 'string' && rawData.trim().length > 0) return rawData

    if (error.code === 'ECONNABORTED') return '로그인 요청 시간이 초과되었습니다.'
    if (error.response?.status === 500) return '서버 오류(500)가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    return '로그인 요청 처리 중 오류가 발생했습니다.'
  }

  return '로그인 처리 중 알 수 없는 오류가 발생했습니다.'
}

export default function LoginScreen() {
  const loading = useAuthUiStore((state) => state.loading)
  const initialLoading = useAuthUiStore((state) => state.initialLoading)
  const loginError = useAuthUiStore((state) => state.loginError)
  const setLoading = useAuthUiStore((state) => state.setLoading)
  const setInitialLoading = useAuthUiStore((state) => state.setInitialLoading)
  const setLoginError = useAuthUiStore((state) => state.setLoginError)
  const resetUiState = useAuthUiStore((state) => state.resetUiState)

  const hydrateFarmFromSession = useSensorStore((state) => state.hydrateFarmFromSession)
  const setIpcamAddress = useCameraUiStore((state) => state.setIpcamAddress)
  const setProfileName = useUiPrefsStore((state) => state.setProfileName)
  const setProfilePhone = useUiPrefsStore((state) => state.setProfilePhone)
  const passwordInputRef = useRef<TextInput>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    mode: 'onChange',
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userId: '',
      password: '',
    },
  })

  const userIdValue = useWatch({ control, name: 'userId' }) ?? ''
  const passwordValue = useWatch({ control, name: 'password' }) ?? ''
  const isLoginDisabled =
    loading || !isValid || userIdValue.trim().length === 0 || passwordValue.trim().length === 0

  useEffect(() => {
    resetUiState()

    const task = InteractionManager.runAfterInteractions(() => {
      const bootstrap = async () => {
        try {
          const consentState = await getConsentState()
          if (!consentState.policiesAccepted) {
            router.replace('/(auth)/terms')
            return
          }

          const session = await getAuthSession()
          if (!session) return

          const profile = await farmApi.getMyFarmProfile().catch(() => null)
          const currentSession = await getAuthSession()
          const hasUsableAccessToken = Boolean(currentSession?.accessToken?.trim())

          if (!hasUsableAccessToken) {
            await clearAuthSession()
            return
          }

          setIpcamAddress(profile?.ipcamAddress)
          router.replace('/(tabs)/home')
        } finally {
          setInitialLoading(false)
        }
      }

      bootstrap().catch(() => setInitialLoading(false))
    })

    return () => task.cancel()
  }, [resetUiState, setIpcamAddress, setInitialLoading])

  const handleLogin = handleSubmit(async (values) => {
    if (loading) return

    setLoading(true)
    setLoginError('')

    try {
      const consentState = await getConsentState()
      if (!consentState.policiesAccepted) {
        setLoginError('약관 동의 후 로그인할 수 있습니다.')
        router.replace('/(auth)/terms')
        return
      }

      const result = await authApi.authenticate({
        username: values.userId,
        password: values.password,
        termsAccepted: consentState.termsAccepted,
        privacyAccepted: consentState.privacyAccepted,
        policiesAccepted: consentState.policiesAccepted,
      })

      await saveAuthSession({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      })

      const profile = await farmApi.getMyFarmProfile()

      hydrateFarmFromSession({
        address: profile?.address,
        latitude: profile?.latitude,
        longitude: profile?.longitude,
      })
      setIpcamAddress(profile?.ipcamAddress)
      setProfileName(profile?.name?.trim() || profile?.username?.trim() || values.userId.trim() || '-')
      setProfilePhone(profile?.phone?.trim() || '-')

      router.replace('/(tabs)/home')
    } catch (error) {
      setLoginError(getLoginErrorMessage(error))
    } finally {
      setLoading(false)
    }
  })

  if (initialLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background dark:bg-background-dark'>
        <ScreenLoader size='small' />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark'>
      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className='flex-1'
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps='handled'
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View className='flex-1 px-6 pb-8 pt-16'>
            <View className='mb-10 items-center'>
              <Image
                source={require('@/assets/images/icon.png')}
                style={{ width: 100, height: 100 }}
                resizeMode='contain'
              />
              <Text className='mt-2 text-subhead text-content-tertiary'>
                스마트팜 모니터링 시스템
              </Text>
            </View>

            <View className='gap-4'>
              <Controller
                control={control}
                name='userId'
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    icon={<User size={20} color='#8E8E93' strokeWidth={1.5} />}
                    placeholder='아이디'
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      onChange(text)
                      if (loginError) setLoginError('')
                    }}
                    autoCapitalize='none'
                    autoCorrect={false}
                    returnKeyType='next'
                    blurOnSubmit={false}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    error={errors.userId?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name='password'
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={passwordInputRef}
                    icon={<Lock size={20} color='#8E8E93' strokeWidth={1.5} />}
                    placeholder='비밀번호'
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      onChange(text)
                      if (loginError) setLoginError('')
                    }}
                    isPassword
                    returnKeyType='done'
                    onSubmitEditing={handleLogin}
                    error={errors.password?.message}
                  />
                )}
              />

              {loginError ? (
                <Text className='mt-1 text-center text-subhead text-danger'>{loginError}</Text>
              ) : null}

              <Button
                title='로그인'
                onPress={handleLogin}
                loading={loading}
                disabled={isLoginDisabled}
                fullWidth
                size='lg'
                className='mt-2'
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

