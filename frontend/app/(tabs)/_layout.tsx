import { AnimatedTabBarButton } from '@/components/AnimatedTabBarButton'
import { AndroidLayout, Colors, IS_ANDROID } from '@/constants/design'
import { useTheme } from '@/hooks/theme'
import { getAuthSession, subscribeAuthSession } from '@/services/storage/authStorage'
import { BlurView } from 'expo-blur'
import { router, Tabs } from 'expo-router'
import { Calendar, House, Settings, Video } from 'lucide-react-native'
import { useEffect } from 'react'
import { AppState, Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TAB_LABELS: Record<string, string> = {
  home: '홈',
  market: '출하시기',
  'market/index': '출하시기',
  camera: '카메라',
  'camera/index': '카메라',
  settings: '설정',
  'settings/index': '설정',
  'chatbot/index': 'AI 비서',
}

export default function TabLayout() {
  const { isDark } = useTheme()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    let mounted = true

    const routeToLogin = () => {
      if (!mounted) return
      router.replace('/(auth)/login')
    }

    const ensureSession = async () => {
      const session = await getAuthSession()
      if (!session?.refreshToken?.trim()) {
        routeToLogin()
      }
    }

    void ensureSession()

    const unsubscribe = subscribeAuthSession((session) => {
      if (!session?.refreshToken?.trim()) {
        routeToLogin()
      }
    })

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void ensureSession()
      }
    })

    return () => {
      mounted = false
      unsubscribe()
      appStateSubscription.remove()
    }
  }, [])

  const bottomPadding =
    Platform.OS === 'ios' ? 20 : IS_ANDROID ? Math.max(insets.bottom, 10) : Math.max(insets.bottom, 12)
  const tabBarHeight =
    Platform.OS === 'ios' ? 64 : IS_ANDROID ? AndroidLayout.tabBarHeight : 52 + insets.bottom
  const tabBarBottom = IS_ANDROID ? insets.bottom : 0

  const tabBarBackground = () => (
    <>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={50}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? Colors.dark.tabBar : Colors.light.tabBar,
            },
          ]}
        />
      )}
    </>
  )

  return (
    <Tabs
      initialRouteName='home'
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarBackground,
        tabBarLabel: TAB_LABELS[route.name] ?? route.name,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: tabBarBottom,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: IS_ANDROID ? 10 : bottomPadding,
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          borderColor: IS_ANDROID
            ? isDark
              ? Colors.dark.tabBarBorder
              : Colors.light.tabBarBorder
            : isDark
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(0,0,0,0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.2 : 0.08,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarActiveTintColor: isDark ? '#C5C5C5' : '#000000',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarAllowFontScaling: false,
        tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
      })}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: '홈',
          tabBarLabel: '홈',
          popToTopOnBlur: true,
          tabBarIcon: ({ color, focused }) => (
            <House size={22} color={color} strokeWidth={focused ? 2.2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name='market/index'
        options={{
          title: '출하시기',
          tabBarLabel: '출하시기',
          tabBarIcon: ({ color, focused }) => (
            <Calendar size={22} color={color} strokeWidth={focused ? 2.2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen name='market/search/index' options={{ href: null, headerShown: false }} />
      <Tabs.Screen name='market/[grade]' options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen
        name='camera/index'
        options={{
          title: '카메라',
          tabBarLabel: '카메라',
          tabBarIcon: ({ color, focused }) => (
            <Video size={22} color={color} strokeWidth={focused ? 2.2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen name='chatbot/index' options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen
        name='settings'
        options={{
          title: '설정',
          tabBarLabel: '설정',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={22} color={color} strokeWidth={focused ? 2.2 : 1.5} />
          ),
        }}
      />
    </Tabs>
  )
}
