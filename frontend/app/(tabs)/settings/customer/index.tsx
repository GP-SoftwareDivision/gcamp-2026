import { Card, ScreenScroll, SectionLabel } from '@/components/ui'
import { useTheme } from '@/hooks/theme'
import { router } from 'expo-router'
import { ChevronLeft, Clock, Mail, Phone } from 'lucide-react-native'
import { Linking, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CS_PHONE = '02-597-1811'
const CS_EMAIL = 'gp@goldenplanet.co.kr'
const HOURS = '09:00~18:00(주말·공휴일·휴무)'

export default function CustomerServiceScreen() {
  const { isDark } = useTheme()
  const iconColor = isDark ? '#C5C5C5' : '#1C1C1E'
  const chevronColor = isDark ? '#E0E0E0' : '#1C1C1E'

  const callCS = () => Linking.openURL(`tel:${CS_PHONE}`)
  const mailCS = () => Linking.openURL(`mailto:${CS_EMAIL}`)

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark'>
      <View className='flex-row items-center px-5 py-4 border-b border-border dark:border-border-dark'>
        <Pressable
          onPress={() => router.back()}
          className='mr-3 active:opacity-70'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={chevronColor} strokeWidth={1.5} />
        </Pressable>
        <Text className='text-title-1 font-bold text-content dark:text-content-dark'>고객센터</Text>
      </View>

      <ScreenScroll className='flex-1' contentContainerClassName='pb-24'>
        <SectionLabel title='연락처' className='px-5 mt-4' />
        <Card className='mx-5 overflow-hidden'>
          <Pressable
            onPress={callCS}
            className='flex-row items-center p-4'
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View
              className='w-9 h-9 rounded-lg items-center justify-center'
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
            >
              <Phone size={18} color={iconColor} strokeWidth={1.8} />
            </View>
            <Text className='flex-1 ml-4 text-body text-content dark:text-content-dark'>대표전화</Text>
            <Text className='text-subhead text-content-tertiary dark:text-content-dark-secondary'>
              {CS_PHONE}
            </Text>
          </Pressable>

          <View className='h-px bg-black/10 dark:bg-white/10' />

          <Pressable
            onPress={mailCS}
            className='flex-row items-center p-4'
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View
              className='w-9 h-9 rounded-lg items-center justify-center'
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
            >
              <Mail size={18} color={iconColor} strokeWidth={1.8} />
            </View>
            <Text className='flex-1 ml-4 text-body text-content dark:text-content-dark'>이메일 문의</Text>
            <Text
              className='max-w-[200px] text-subhead text-content-tertiary dark:text-content-dark-secondary'
              numberOfLines={1}
            >
              {CS_EMAIL}
            </Text>
          </Pressable>
        </Card>

        <SectionLabel title='운영 안내' className='px-5 mt-6' />
        <Card className='mx-5 overflow-hidden'>
          <View className='flex-row items-center p-4'>
            <View
              className='w-9 h-9 rounded-lg items-center justify-center'
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
            >
              <Clock size={18} color={iconColor} strokeWidth={1.8} />
            </View>
            <Text className='flex-1 ml-4 text-body text-content dark:text-content-dark'>운영시간</Text>
            <Text
              className='text-subhead text-content-tertiary dark:text-content-dark-secondary'
              numberOfLines={1}
            >
              {HOURS}
            </Text>
          </View>
        </Card>
      </ScreenScroll>
    </SafeAreaView>
  )
}
