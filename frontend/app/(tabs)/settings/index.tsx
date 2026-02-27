import { Card, ScreenScroll, SectionLabel, TabHeader } from '@/components/ui'
import { Colors } from '@/constants/design'
import { useTheme } from '@/hooks/theme'
import { farmApi } from '@/services/api'
import { clearAuthSession } from '@/services/storage/authStorage'
import { useCameraUiStore } from '@/store/cameraUiStore'
import { UNKNOWN_FARM_ADDRESS, useSensorStore } from '@/store/sensorStore'
import { useUiPrefsStore } from '@/store/uiPrefsStore'
import type { MenuItemProps } from '@/types/pages/tabs'
import { router } from 'expo-router'
import { ChevronRight, Headphones, LogOut, MapPin, Moon, Phone, User } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Modal, Platform, Pressable, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type SettingsMenuItemProps = MenuItemProps & {
  showDivider?: boolean
}

const TEXT = {
  settings: '설정',
  userInfo: '사용자 정보',
  name: '이름',
  phone: '연락처',
  address: '주소',
  appSettings: '앱 설정',
  darkMode: '다크 모드',
  customerCenter: '고객센터',
  account: '계정',
  logout: '계정전환',
  logoutTitle: '계정전환',
  logoutMessage:
    '아이디와 비밀번호를 정확히 기억하고 계신가요?\n확인되지 않으면 로그인에 어려움이 있을 수 있습니다. 그래도 계정전환을 진행하시겠습니까?',
  cancel: '취소',
  confirm: '확인',
} as const
function MenuItem({
  icon,
  label,
  value,
  onPress,
  toggle,
  toggleValue,
  onToggle,
  isDark,
  showDivider = true,
}: SettingsMenuItemProps) {
  const c = isDark ? Colors.dark : Colors.light
  const trackColor = { false: c.border, true: c.primary }
  const thumbColor = '#FFFFFF'
  const isAndroid = Platform.OS === 'android'

  return (
    <View>
      <Pressable
        onPress={toggle ? undefined : onPress}
        className='flex-row items-center p-4'
        style={({ pressed }) => ({ opacity: toggle ? 1 : pressed ? 0.6 : 1 })}
      >
        <View className='items-center justify-center rounded-lg h-9 w-9 bg-black/5 dark:bg-white/10'>
          {icon}
        </View>

        <Text className='flex-1 ml-4 text-body text-content dark:text-content-dark'>{label}</Text>

        {toggle ? (
          isAndroid ? (
            <Pressable
              accessibilityRole='switch'
              accessibilityState={{ checked: Boolean(toggleValue) }}
              onPress={() => onToggle?.(!Boolean(toggleValue))}
              style={{
                width: 48,
                height: 28,
                borderRadius: 999,
                padding: 2,
                justifyContent: 'center',
                backgroundColor: toggleValue ? c.primary : c.border,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  backgroundColor: thumbColor,
                  alignSelf: toggleValue ? 'flex-end' : 'flex-start',
                }}
              />
            </Pressable>
          ) : (
            <Switch
              value={toggleValue}
              onValueChange={onToggle}
              trackColor={trackColor}
              thumbColor={thumbColor}
            />
          )
        ) : (
          <View className='flex-row items-center gap-2'>
            {value ? (
              <Text
                className='max-w-[200px] text-subhead text-content-tertiary dark:text-content-dark-secondary'
                numberOfLines={1}
              >
                {value}
              </Text>
            ) : null}
            {onPress ? (
              <ChevronRight size={18} color={isDark ? '#C5C5C5' : '#1C1C1E'} strokeWidth={1.5} />
            ) : null}
          </View>
        )}
      </Pressable>

      {showDivider ? <View className='h-px bg-black/10 dark:bg-white/10' /> : null}
    </View>
  )
}

export default function ProfileScreen() {
  const { isDark, setMode } = useTheme()
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)
  const profileName = useUiPrefsStore((state) => state.profileName)
  const profilePhone = useUiPrefsStore((state) => state.profilePhone)
  const setProfileName = useUiPrefsStore((state) => state.setProfileName)
  const setProfilePhone = useUiPrefsStore((state) => state.setProfilePhone)

  const farmAddress = useSensorStore((state) => state.farmAddress)
  const fetchFarmInfo = useSensorStore((state) => state.fetchFarmInfo)
  const hydrateFarmFromSession = useSensorStore((state) => state.hydrateFarmFromSession)
  const setIpcamAddress = useCameraUiStore((state) => state.setIpcamAddress)

  const iconColor = isDark ? '#FFFFFF' : '#1C1C1E'
  const handleLogoutConfirm = async () => {
    setLogoutModalVisible(false)
    setIpcamAddress(null)
    await clearAuthSession()
    router.replace('/(auth)/login')
  }

  useEffect(() => {
    let mounted = true

    const loadProfileName = async () => {
      try {
        const profile = await farmApi.getMyFarmProfile()
        if (!mounted) return

        const name = profile?.name?.trim()
        const username = profile?.username?.trim()
        const phone = profile?.phone?.trim()

        hydrateFarmFromSession({
          address: profile?.address,
          latitude: profile?.latitude,
          longitude: profile?.longitude,
        })
        setIpcamAddress(profile?.ipcamAddress)

        setProfileName(name || username || '-')
        setProfilePhone(phone || '-')
      } catch {
        if (mounted) {
          setProfileName('-')
          setProfilePhone('-')
        }
      }
    }

    loadProfileName().catch(() => {
      if (mounted) {
        setProfileName('-')
        setProfilePhone('-')
      }
    })

    return () => {
      mounted = false
    }
  }, [hydrateFarmFromSession, setIpcamAddress, setProfileName, setProfilePhone])

  useEffect(() => {
    if (farmAddress && farmAddress !== UNKNOWN_FARM_ADDRESS) return
    fetchFarmInfo().catch(() => undefined)
  }, [farmAddress, fetchFarmInfo])

  const displayAddress = farmAddress && farmAddress !== UNKNOWN_FARM_ADDRESS ? farmAddress : '-'

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
      <TabHeader title={TEXT.settings} />
      <ScreenScroll className='flex-1' contentContainerClassName='pb-24'>
        <SectionLabel title={TEXT.userInfo} className='px-5' />
        <Card className='mx-5'>
          <MenuItem
            isDark={isDark}
            icon={<User size={18} color={iconColor} strokeWidth={1.8} />}
            label={TEXT.name}
            value={profileName}
          />
          <MenuItem
            isDark={isDark}
            icon={<Phone size={18} color={iconColor} strokeWidth={1.8} />}
            label={TEXT.phone}
            value={profilePhone}
          />
          <MenuItem
            isDark={isDark}
            icon={<MapPin size={18} color={iconColor} strokeWidth={1.8} />}
            label={TEXT.address}
            value={displayAddress}
            showDivider={false}
          />
        </Card>

        <SectionLabel title={TEXT.appSettings} className='px-5 mt-6' />
        <Card className='mx-5'>
          <MenuItem
            isDark={isDark}
            icon={<Moon size={18} color={iconColor} strokeWidth={1.8} />}
            label={TEXT.darkMode}
            toggle
            toggleValue={isDark}
            onToggle={(value) => setMode(value ? 'dark' : 'light')}
            showDivider={false}
          />
        </Card>

        <SectionLabel title={TEXT.customerCenter} className='px-5 mt-6' />
        <Card className='mx-5'>
          <MenuItem
            isDark={isDark}
            icon={<Headphones size={18} color={iconColor} strokeWidth={1.8} />}
            label={TEXT.customerCenter}
            onPress={() => router.push('/(tabs)/settings/customer')}
            showDivider={false}
          />
        </Card>

        <SectionLabel title={TEXT.account} className='px-5 mt-6' />
        <Card className='mx-5 mb-8'>
          <Pressable
            onPress={() => setLogoutModalVisible(true)}
            className='flex-row items-center p-4'
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View className='items-center justify-center rounded-lg h-9 w-9 bg-danger/15 dark:bg-danger/25'>
              <LogOut size={18} color='#FF1744' strokeWidth={1.8} />
            </View>
            <Text className='flex-1 ml-4 text-body text-danger dark:text-danger'>
              {TEXT.logout}
            </Text>
          </Pressable>
        </Card>
      </ScreenScroll>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className='items-center justify-center flex-1 px-6 bg-black/45'>
          <View className='w-full max-w-[360px] rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-card-dark'>
            <Text className='font-bold text-title-2 text-content dark:text-content-dark'>
              {TEXT.logoutTitle}
            </Text>
            <Text className='mt-3 text-body text-content-secondary dark:text-content-dark-secondary'>
              {TEXT.logoutMessage}
            </Text>

            <View className='flex-row gap-3 mt-6'>
              <Pressable
                onPress={() => setLogoutModalVisible(false)}
                className='h-12 flex-1 items-center justify-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E]'
              >
                <Text className='font-semibold text-headline text-content dark:text-content-dark'>
                  {TEXT.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleLogoutConfirm}
                className='items-center justify-center flex-1 h-12 rounded-full bg-danger dark:bg-danger'
              >
                <Text className='font-semibold text-white text-headline'>{TEXT.logout}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

