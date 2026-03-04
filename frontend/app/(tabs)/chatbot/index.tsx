import { TabHeader } from '@/components/ui'
import { AndroidLayout, IS_ANDROID } from '@/constants/design'
import { useTheme } from '@/hooks/theme'
import type { Message } from '@/types/pages'
import { Leaf, Plus, Send } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRef, useState } from 'react'
import {
  ActionSheetIOS,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const QUICK_QUESTIONS = [
  '습도 관리 팁을 알려줘',
  '오늘 관수량 점검 포인트를 알려줘',
  '지금 시기에 병해충 체크할 항목이 뭐야?',
]

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    type: 'bot',
    content: '안녕하세요. AI 비서입니다. 작물 상태나 관리 방법을 편하게 물어보세요.',
  },
]

const MIN_INPUT_HEIGHT = 24
const MAX_INPUT_HEIGHT = 96

export default function ChatbotScreen() {
  const { isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [inputText, setInputText] = useState('')
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT)

  const scrollRef = useRef<ScrollView>(null)
  const messageIdRef = useRef(2)

  const composerBottomPadding = IS_ANDROID
    ? AndroidLayout.tabBarHeight + 8
    : Math.max(insets.bottom, 10) + 54

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 80)
  }

  const handleInputContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    const nextHeight = Math.ceil(event.nativeEvent.contentSize.height)
    const clamped = Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, nextHeight))
    setInputHeight(clamped)
  }

  const appendUserMessage = (text: string, image?: string) => {
    const trimmed = text.trim()
    if (!trimmed && !image) return

    const userMessage: Message = {
      id: messageIdRef.current,
      type: 'user',
      content: trimmed || '이미지를 확인해 주세요.',
      image,
    }
    messageIdRef.current += 1

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setInputHeight(MIN_INPUT_HEIGHT)
    scrollToBottom()

    setTimeout(() => {
      const botMessage: Message = {
        id: messageIdRef.current,
        type: 'bot',
        content: '현재는 프로토타입 단계입니다. 곧 실제 AI 응답과 연결될 예정입니다.',
      }
      messageIdRef.current += 1
      setMessages((prev) => [...prev, botMessage])
      scrollToBottom()
    }, 700)
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      appendUserMessage('', result.assets[0].uri)
    }
  }

  const pickFromAlbum = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      appendUserMessage('', result.assets[0].uri)
    }
  }

  const openImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '카메라로 촬영', '앨범에서 선택'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto()
          if (buttonIndex === 2) pickFromAlbum()
        },
      )
      return
    }

    Alert.alert('이미지 추가', '첨부할 이미지를 선택해 주세요.', [
      { text: '취소', style: 'cancel' },
      { text: '카메라로 촬영', onPress: takePhoto },
      { text: '앨범에서 선택', onPress: pickFromAlbum },
    ])
  }

  const isSendDisabled = inputText.trim().length === 0

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
      <TabHeader title='AI 비서' />

      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View className='flex-1'>
          <ScrollView
            ref={scrollRef}
            className='flex-1 px-5'
            contentContainerClassName='pt-1 pb-6'
            keyboardShouldPersistTaps='handled'
          >
            {messages.map((message) => {
              const isBot = message.type === 'bot'

              return (
                <View key={message.id} className={`mb-3 ${isBot ? 'items-start' : 'items-end'}`}>
                  {isBot ? (
                    <View className='max-w-[90%] flex-row items-end gap-2'>
                      <View className='mb-1 h-9 w-9 items-center justify-center rounded-full bg-black dark:bg-white'>
                        <Leaf size={17} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2} />
                      </View>
                      <View className='rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 dark:border-border-dark dark:bg-card-dark'>
                        <Text className='text-body leading-6 text-content dark:text-content-dark'>
                          {message.content}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className='max-w-[88%]'>
                      {message.image ? (
                        <View className='mb-2 overflow-hidden rounded-2xl border border-border dark:border-border-dark'>
                          <Image
                            source={{ uri: message.image }}
                            className='h-48 w-48 rounded-2xl'
                            resizeMode='cover'
                          />
                        </View>
                      ) : null}
                      <View className='rounded-2xl rounded-br-sm bg-black px-4 py-3 dark:bg-white'>
                        <Text className='text-body font-medium leading-6 text-white dark:text-black'>
                          {message.content}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )
            })}

            {messages.length === 1 ? (
              <View className='mt-2 gap-2 pl-11'>
                {QUICK_QUESTIONS.map((question) => (
                  <Pressable
                    key={question}
                    onPress={() => appendUserMessage(question)}
                    className='self-start rounded-2xl border border-border bg-card px-4 py-3 dark:border-border-dark dark:bg-card-dark'
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className='text-subhead font-medium text-content dark:text-content-dark'>
                      {question}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>

        <View
          className='bg-background px-5 pt-3 dark:bg-background-dark'
          style={{ paddingBottom: composerBottomPadding }}
        >
          <View
            className='flex-row items-end rounded-2xl border border-border bg-card px-2 py-2 dark:border-border-dark dark:bg-card-dark'
            style={{ minHeight: 56 }}
          >
            <Pressable
              onPress={openImagePicker}
              className='h-10 w-10 items-center justify-center rounded-xl'
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              accessibilityRole='button'
              accessibilityLabel='이미지 첨부'
            >
              <Plus size={20} color='#8E8E93' strokeWidth={2} />
            </Pressable>

            <View className='mx-1 flex-1'>
              <TextInput
                className='py-2 text-body leading-6 text-content dark:text-content-dark'
                placeholderTextColor='#8E8E93'
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                onContentSizeChange={handleInputContentSizeChange}
                style={{
                  minHeight: inputHeight,
                  maxHeight: MAX_INPUT_HEIGHT,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            <Pressable
              onPress={() => appendUserMessage(inputText)}
              disabled={isSendDisabled}
              className={`h-10 w-10 items-center justify-center rounded-full ${
                isSendDisabled ? 'bg-background dark:bg-[#111216]' : 'bg-black dark:bg-white'
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              accessibilityRole='button'
              accessibilityLabel='메시지 전송'
            >
              <Send
                size={17}
                color={isSendDisabled ? '#8E8E93' : isDark ? '#000000' : '#FFFFFF'}
                strokeWidth={1.9}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
