import { TabHeader } from '@/components/ui'
import { useTheme } from '@/hooks/theme'
import { sendPtzCommand } from '@/utils/camera'
import { useCameraUiStore } from '@/store/cameraUiStore'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Expand,
  Minimize,
  Minus,
  Plus,
  Zap,
} from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, Dimensions, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VLCPlayer } from 'react-native-vlc-media-player'

const CONNECT_TIMEOUT_MS = 60_000
const WINDOW_WIDTH = Dimensions.get('window').width
const TOP_PLAYER_HEIGHT = Math.round(WINDOW_WIDTH * (9 / 16))

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export default function CameraScreen() {
  const { isDark } = useTheme()
  const isFullscreen = useCameraUiStore((state) => state.isFullscreen)
  const isConnecting = useCameraUiStore((state) => state.isConnecting)
  const isStreamReady = useCameraUiStore((state) => state.isStreamReady)
  const connectionIssueMessage = useCameraUiStore((state) => state.connectionIssueMessage)
  const ipcamAddress = useCameraUiStore((state) => state.ipcamAddress)
  const toggleFullscreen = useCameraUiStore((state) => state.toggleFullscreen)
  const startConnecting = useCameraUiStore((state) => state.startConnecting)
  const markStreamReady = useCameraUiStore((state) => state.markStreamReady)
  const markStreamError = useCameraUiStore((state) => state.markStreamError)
  const setConnectionTimeoutIssue = useCameraUiStore((state) => state.setConnectionTimeoutIssue)

  const iconColor = isDark ? '#FFFFFF' : '#1C1C1E'
  const iconBg = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)'
  const hasPlayedOnceRef = useRef(false)

  useEffect(() => {
    if (!ipcamAddress || isStreamReady || !isConnecting) return
    const timeoutId = setTimeout(() => {
      setConnectionTimeoutIssue()
    }, CONNECT_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [ipcamAddress, isConnecting, isStreamReady, setConnectionTimeoutIssue])

  useEffect(() => {
    if (!ipcamAddress) {
      hasPlayedOnceRef.current = false
    }
  }, [ipcamAddress])

  const handlePlaying = () => {
    hasPlayedOnceRef.current = true
  }

  const handleBuffering = (buffering: unknown) => {
    const payload = asRecord(buffering)
    const isPlaying = readBoolean(payload?.isPlaying)
    const bufferRate = readNumber(payload?.bufferRate)
    const currentTime = readNumber(payload?.currentTime)

    if (isPlaying === false && currentTime === 0) {
      hasPlayedOnceRef.current = false
    }

    if (typeof bufferRate === 'number') {
      if (bufferRate < 100) {
        startConnecting()
      } else {
        markStreamReady()
      }
    } else if (isPlaying === false || !isStreamReady) {
      startConnecting()
    }
  }

  const handleError = (_error: unknown) => {
    markStreamError()
  }

  const handlePtzStart = (command: 'up' | 'down' | 'left' | 'right' | 'zoomin' | 'zoomout') => {
    if (!ipcamAddress) return
    sendPtzCommand(ipcamAddress, command)
  }

  const handlePtzStop = (command: 'stop' | 'zoomstop') => {
    if (!ipcamAddress) return
    sendPtzCommand(ipcamAddress, command)
  }

  const renderPtzController = () => {
    const circleBg = isDark ? '#1A1D23' : '#F4F5F9'
    const circleBorder = isDark ? 'rgba(255,255,255,0.16)' : '#D8DBE3'
    const centerBg = isDark ? '#1F232C' : '#ECEEF3'
    const centerBorder = isDark ? 'rgba(255,255,255,0.08)' : '#E2E5EC'
    const arrowColor = isDark ? '#D8DBE2' : '#3D4250'
    const plusMinusColor = isDark ? '#DDE0E6' : '#4A4F5C'

    return (
      <View className='items-center px-6 pt-32 pb-8'>
        <View
          className='items-center justify-center border rounded-full w-72 h-72'
          style={{
            backgroundColor: circleBg,
            borderColor: circleBorder,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.35 : 0.12,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: isDark ? 26 : 16,
            elevation: isDark ? 10 : 4,
          }}
        >
          <Pressable
            onPressIn={() => handlePtzStart('up')}
            onPressOut={() => handlePtzStop('stop')}
            className='absolute items-center justify-center rounded-full top-7 w-14 h-14 active:opacity-70'
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronUp size={38} color={arrowColor} strokeWidth={1.8} />
          </Pressable>

          <Pressable
            onPressIn={() => handlePtzStart('left')}
            onPressOut={() => handlePtzStop('stop')}
            className='absolute items-center justify-center rounded-full left-7 w-14 h-14 active:opacity-70'
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={38} color={arrowColor} strokeWidth={1.8} />
          </Pressable>

          <Pressable
            onPressIn={() => handlePtzStart('right')}
            onPressOut={() => handlePtzStop('stop')}
            className='absolute items-center justify-center rounded-full right-7 w-14 h-14 active:opacity-70'
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronRight size={38} color={arrowColor} strokeWidth={1.8} />
          </Pressable>

          <Pressable
            onPressIn={() => handlePtzStart('down')}
            onPressOut={() => handlePtzStop('stop')}
            className='absolute items-center justify-center rounded-full bottom-7 w-14 h-14 active:opacity-70'
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronDown size={38} color={arrowColor} strokeWidth={1.8} />
          </Pressable>

          {/* 줌 인/아웃 UI: 가운데 선 강제 중앙 정렬 완료 */}
          <View
            className='relative items-center justify-center w-24 h-24 overflow-hidden border rounded-full'
            style={{
              backgroundColor: centerBg,
              borderColor: centerBorder,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.08 : 0.1,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: isDark ? 1 : 2,
            }}
          >
            <Pressable
              onPressIn={() => handlePtzStart('zoomin')}
              onPressOut={() => handlePtzStop('zoomstop')}
              className='items-center justify-center flex-1 w-full pt-2 pb-1 active:bg-black/5 dark:active:bg-white/5'
            >
              <Plus size={30} color={plusMinusColor} strokeWidth={2.2} />
            </Pressable>

            {/* 가운데 선을 absolute로 띄워서 정확히 50% 위치에 고정 */}
            <View
              className='absolute w-14 h-[1px] top-1/2'
              style={{ backgroundColor: centerBorder, marginTop: -0.5 }}
            />

            <Pressable
              onPressIn={() => handlePtzStart('zoomout')}
              onPressOut={() => handlePtzStop('zoomstop')}
              className='items-center justify-center flex-1 w-full pt-1 pb-2 active:bg-black/5 dark:active:bg-white/5'
            >
              <Minus size={30} color={plusMinusColor} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  const renderVideo = (height: number | '100%') => (
    <View
      className='relative w-full overflow-hidden bg-black'
      style={{ height, minHeight: height === '100%' ? undefined : height }}
    >
      {ipcamAddress ? (
        <VLCPlayer
          style={{
            width: '100%',
            height: '100%',
            transform: [{ scale: isFullscreen ? 1.45 : 1.18 }],
          }}
          source={{
            uri: ipcamAddress,
            initOptions: ['--network-caching=300'],
          }}
          autoplay
          resizeMode='cover'
          onPlaying={handlePlaying}
          onBuffering={handleBuffering}
          onError={handleError}
        />
      ) : (
        <View className='absolute inset-0 items-center justify-center px-6'>
          <Text className='text-center text-white/80 text-subhead'>
            카메라 주소가 없습니다. 다시 로그인해 주세요.
          </Text>
        </View>
      )}

      {ipcamAddress && isConnecting ? (
        <View className='absolute inset-0 items-center justify-center bg-black/35'>
          <ActivityIndicator size='large' color='#FFFFFF' />
        </View>
      ) : null}

      <Pressable
        onPress={toggleFullscreen}
        className='absolute items-center justify-center w-10 h-10 rounded-full right-3 top-3'
        style={{ backgroundColor: iconBg }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isFullscreen ? (
          <Minimize size={18} color={iconColor} />
        ) : (
          <Expand size={18} color={iconColor} />
        )}
      </Pressable>
    </View>
  )

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
      <View className='flex-1'>
        {!isFullscreen ? <TabHeader title='카메라' /> : null}
        {renderVideo(isFullscreen ? '100%' : TOP_PLAYER_HEIGHT)}
        {!isFullscreen ? (
          <View className='flex-1 bg-background dark:bg-background-dark'>
            {connectionIssueMessage ? (
              <View className='items-center px-8 pt-8 pb-2'>
                <Zap size={64} color={isDark ? '#7C808B' : '#8E92A0'} strokeWidth={1.6} />
                <Text className='mt-4 font-semibold text-danger text-title-2'>
                  접속이 원활하지 않습니다
                </Text>
                <Text className='mt-2 text-content-tertiary dark:text-content-dark-secondary text-subhead'>
                  네트워크 연결을 확인해 주세요
                </Text>
              </View>
            ) : (
              <View className='h-5' />
            )}
            {renderPtzController()}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

