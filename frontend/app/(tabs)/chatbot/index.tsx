import { ScreenScroll } from '@/components/ui'
import type { Message } from '@/types/pages/tabs'
import { ImagePlus, Leaf, Plus, Send } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRef, useState } from 'react'
import { ActionSheetIOS, Alert, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const QUICK_QUESTIONS = [
  { icon: '🍅', text: '방울토마토 잎이 시들어요' },
  { icon: '🌿', text: '흰가루병 증상 보여줘' },
  { icon: '🌡️', text: '적정 온도 알려줘' },
]

const INITIAL_MESSAGES: Message[] = [{ id: 1, type: 'bot', content: '안녕하세요! 오늘은 작물 상태가 어떤가요? 궁금한 점을 물어보세요.' }]

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [inputText, setInputText] = useState('')
  const scrollViewRef = useRef<import('react-native').ScrollView>(null)

  const sendMessage = (text: string, image?: string) => {
    if (!text.trim() && !image) return
    const userMessage: Message = { id: messages.length + 1, type: 'user', content: text || '이미지를 분석해주세요', image }
    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)
    setTimeout(() => {
      const botResponse: Message = { id: messages.length + 2, type: 'bot', content: '죄송합니다. 현재 서비스 준비중 입니다.' }
      setMessages((prev) => [...prev, botResponse])
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)
    }, 1000)
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (!result.canceled && result.assets[0]) sendMessage('', result.assets[0].uri)
  }

  const pickFromAlbum = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (!result.canceled && result.assets[0]) sendMessage('', result.assets[0].uri)
  }

  const handleImagePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['취소', '카메라로 촬영', '앨범에서 선택'], cancelButtonIndex: 0 }, (buttonIndex) => {
        if (buttonIndex === 1) takePhoto()
        else if (buttonIndex === 2) pickFromAlbum()
      })
    } else {
      Alert.alert('이미지 추가', '어떻게 추가할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '카메라로 촬영', onPress: takePhoto },
        { text: '앨범에서 선택', onPress: pickFromAlbum },
      ])
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
      <View className='px-5 py-4'>
        <Text className='text-title-lg text-content dark:text-content-dark'>AI 비서</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1' keyboardVerticalOffset={0}>
        <ScreenScroll ref={scrollViewRef} className='flex-1 px-5' contentContainerClassName='py-4'>
          {messages.map((message) => (
            <View key={message.id} className={`mb-4 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
              {message.type === 'bot' ? (
                <View className='flex-row items-end gap-2 max-w-[88%]'>
                  <View className='w-10 h-10 bg-primary rounded-full items-center justify-center mb-1'>
                    <Leaf size={20} color='#FFFFFF' strokeWidth={1.8} />
                  </View>
                  <View className='flex-1 rounded-3xl rounded-bl-lg p-4 bg-card dark:bg-card-dark'>
                    <Text className='text-body text-content dark:text-content-dark leading-6'>{message.content}</Text>
                  </View>
                </View>
              ) : (
                <View className='max-w-[80%]'>
                  {message.image ? (
                    <View className='mb-2 rounded-2xl overflow-hidden'>
                      {message.image === 'camera_capture' ? (
                        <View className='w-48 h-48 bg-gray-300 items-center justify-center rounded-2xl'>
                          <ImagePlus size={40} color='#666' strokeWidth={1.5} />
                          <Text className='text-caption-1 text-gray-500 mt-2'>촬영된 이미지</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: message.image }} className='w-48 h-48 rounded-2xl' resizeMode='cover' />
                      )}
                    </View>
                  ) : null}
                  <View className='bg-primary rounded-3xl rounded-br-lg px-5 py-3'>
                    <Text className='text-body text-white font-medium'>{message.content}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}

          {messages.length === 1 && (
            <View className='gap-2 mt-2 ml-12'>
              {QUICK_QUESTIONS.map((q, i) => (
                <Pressable
                  key={i}
                  onPress={() => sendMessage(q.text)}
                  className='flex-row items-center px-4 py-3 bg-card dark:bg-card-dark rounded-2xl self-start'
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, borderCurve: 'continuous' })}
                >
                  <Text className='text-lg mr-2'>{q.icon}</Text>
                  <Text className='text-body text-content dark:text-content-dark font-medium'>{q.text}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScreenScroll>

        <View className='px-5 py-4 bg-background dark:bg-background-dark'>
          <View className='flex-row items-center gap-2'>
            <Pressable onPress={handleImagePress} className='w-12 h-12 items-center justify-center bg-primary rounded-full' style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Plus size={24} color='#FFFFFF' strokeWidth={2} />
            </Pressable>
            <View className='flex-1 flex-row items-center bg-card dark:bg-card-dark rounded-full px-4 h-12' style={{ borderCurve: 'continuous' }}>
              <TextInput
                className='flex-1 text-body text-content dark:text-content-dark'
                placeholder='무엇이든 물어보세요'
                placeholderTextColor='#8E8E93'
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessage(inputText)}
              />
            </View>
            <Pressable onPress={() => sendMessage(inputText)} className='w-12 h-12 rounded-full items-center justify-center bg-primary' style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Send size={20} color='#FFFFFF' strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
