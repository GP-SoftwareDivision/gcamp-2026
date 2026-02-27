/**
 * 앱 진입점: Android에서만 시스템 글자 크기 설정 무시(allowFontScaling: false).
 * prebuild 없이 동작합니다.
 */
const { LogBox, Platform, Text, TextInput } = require('react-native')

// 라이브러리 경고 무시 (앱 동작/빌드에는 영향 없음) – 맨 앞에서 등록
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead. See https://github.com/th3rdwave/react-native-safe-area-context",
  'setBackgroundColorAsync',
  'setBackgroundColorAsync is not supported with edge-to-edge',
  'edge-to-edge',
  'Unable to activate keep awake',
])

// Some third-party packages still emit this warning in RN 0.81.
const originalWarn = console.warn
const originalError = console.error
console.warn = (...args) => {
  const firstArg = args[0]
  if (typeof firstArg === 'string' && firstArg.includes('SafeAreaView has been deprecated')) {
    return
  }
  originalWarn(...args)
}

console.error = (...args) => {
  const firstArg = args[0]
  if (
    typeof firstArg === 'string' &&
    (firstArg.includes('Unable to activate keep awake') ||
      firstArg.includes('Uncaught (in promise') && firstArg.includes('keep awake'))
  ) {
    return
  }
  if (
    firstArg &&
    typeof firstArg === 'object' &&
    typeof firstArg.message === 'string' &&
    firstArg.message.includes('Unable to activate keep awake')
  ) {
    return
  }
  originalError(...args)
}

if (Platform.OS === 'android') {
  const textProps = Text.defaultProps || {}
  const inputProps = TextInput.defaultProps || {}
  Text.defaultProps = { ...textProps, allowFontScaling: false }
  TextInput.defaultProps = { ...inputProps, allowFontScaling: false }
}

require('expo-router/entry')
