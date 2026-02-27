import { Button, ScreenScroll } from '@/components/ui'
import { useTheme } from '@/hooks/theme'
import { ChevronDown, ChevronLeft } from 'lucide-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import {
  getConsentState,
  getAuthSession,
  setPoliciesAccepted,
  setPrivacyAccepted,
  setTermsAccepted,
} from '@/services/storage/authStorage'
import { useEffect, useRef, useState } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// ========================
// 조항 컴포넌트
// ========================
function ArticleTitle({ children }: { children: string }) {
  return (
    <Text className='mt-6 mb-2 font-bold text-body text-content dark:text-content-dark'>
      {children}
    </Text>
  )
}

function ArticleBody({ children }: { children: string }) {
  return (
    <Text className='leading-6 text-subhead text-content-secondary dark:text-content-dark-secondary'>
      {children}
    </Text>
  )
}

// ========================
// 이용약관 조항 데이터
// ========================
const TERMS_ARTICLES = [
  {
    title: '제1조 (목적)',
    body: '이 약관은 주식회사 골든플래닛(이하 "회사")가 제공하는 스마트팜 모니터링 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (정의)',
    body: '① "서비스"란 회사가 제공하는 스마트팜 환경 모니터링, 시세 분석, AI 비서 ,시설제어 등 관련 제반 서비스를 의미합니다.\n\n② "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.\n\n③ "계정"이란 이용자의 식별과 서비스 이용을 위해 회사가 부여한 아이디와 비밀번호를 의미합니다.',
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    body: '① 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.\n\n② 회사는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위 내에서 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.\n\n③ 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.',
  },
  {
    title: '제4조 (서비스의 제공)',
    body: '① 회사는 다음과 같은 서비스를 제공합니다.\n\n  1. 스마트팜 환경 데이터 모니터링\n     (온도, 습도, CO2, 광량 등)\n  2. 농산물 도매시장 실시간 시세 정보\n  3. 출하시기 분석 및 AI 예측 서비스\n  4. AI 비서를 통한 농업 상담\n  5. CCTV 실시간 모니터링\n  6. 시설제어\n  7. 기타 회사가 정하는 서비스\n\n② 회사는 서비스의 품질 향상을 위해 서비스의 내용을 변경할 수 있으며, 이 경우 변경 내용을 사전에 공지합니다.',
  },
  {
    title: '제5조 (서비스 이용시간)',
    body: '① 서비스의 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다.\n\n② 회사는 시스템 점검, 증설 및 교체, 설비의 장애, 서비스 이용의 폭주, 국가비상사태, 정전 등 부득이한 사유가 발생한 경우 서비스의 전부 또는 일부를 제한하거나 중지할 수 있습니다.',
  },
  {
    title: '제6조 (이용자의 의무)',
    body: '① 이용자는 관련 법령, 이 약관, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 합니다.\n\n② 이용자는 회사가 부여한 계정 정보를 제3자에게 양도하거나 공유할 수 없습니다.\n\n③ 이용자는 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 등의 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.',
  },
  {
    title: '제7조 (회사의 의무)',
    body: '① 회사는 관련 법령과 이 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위하여 최선을 다합니다.\n\n② 회사는 이용자의 개인정보 보호를 위해 보안 시스템을 갖추어야 하며 개인정보처리방침을 공시하고 준수합니다.\n\n③ 회사는 서비스 이용과 관련하여 이용자로부터 제기된 의견이나 불만이 정당하다고 인정할 경우에는 이를 처리하여야 합니다.',
  },
  {
    title: '제8조 (면책조항)',
    body: '① 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.\n\n② 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.\n\n③ 회사가 제공하는 시세 정보, AI 예측 분석 등은 참고 자료이며, 이를 기반으로 한 이용자의 판단 및 행위에 대해 회사는 책임을 지지 않습니다.',
  },
  {
    title: '제9조 (분쟁해결)',
    body: '회사와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법률을 적용하며, 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.',
  },
  {
    title: '부칙',
    body: '이 약관은 2026년 2월 25일부터 시행합니다.',
  },
]

// ========================
// 개인정보처리방침 조항 데이터
// ========================
const PRIVACY_ARTICLES = [
  {
    title: '',
    body: '주식회사 골든플래닛(이하 "회사")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.',
  },
  {
    title: '제1조 (개인정보의 처리목적)',
    body: '회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.\n\n  1. 서비스 제공\n     스마트팜 모니터링 서비스 제공,\n     본인 인증, 서비스 부정이용 방지\n\n  2. 회원 관리\n     회원제 서비스 이용에 따른 본인 확인,\n     서비스 제공에 관한 계약 이행\n\n  3. 서비스 개선\n     서비스 이용 통계,\n     서비스 개선을 위한 분석',
  },
  {
    title: '제2조 (처리하는 개인정보의 항목)',
    body: '회사는 다음의 개인정보 항목을 처리하고 있습니다.\n\n  1. 필수항목\n     이름, 아이디, 비밀번호,\n     연락처(휴대폰 번호), 주소\n\n  2. 자동수집항목\n     서비스 이용기록, 접속 로그,\n     접속 IP 정보, 기기 정보',
  },
  {
    title: '제3조 (개인정보의 처리 및 보유기간)',
    body: '① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.\n\n② 각각의 개인정보 처리 및 보유기간은 다음과 같습니다.\n\n  1. 회원 가입 및 관리\n     → 회원 탈퇴 시까지\n\n  2. 서비스 제공\n     → 서비스 공급 완료 및\n        요금 결제·정산 완료 시까지\n\n  3. 관련 법령에 따른 보존\n     → 계약 또는 청약철회 등에 관한\n        기록 (5년)\n     → 대금결제 및 재화 등의 공급에\n        관한 기록 (5년)\n     → 소비자의 불만 또는 분쟁처리에\n        관한 기록 (3년)',
  },
  {
    title: '제4조 (개인정보의 제3자 제공)',
    body: '회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.',
  },
  {
    title: '제5조 (개인정보의 파기)',
    body: '① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.\n\n② 파기의 절차 및 방법은 다음과 같습니다.\n\n  1. 파기절차\n     불필요한 개인정보는 개인정보의\n     처리가 불필요한 것으로 인정되는\n     날로부터 5일 이내에 파기합니다.\n\n  2. 파기방법\n     전자적 파일 형태의 정보는 기록을\n     재생할 수 없는 기술적 방법을\n     사용합니다.',
  },
  {
    title: '제6조 (정보주체의 권리·의무 및 행사방법)',
    body: '정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.\n\n  1. 개인정보 열람요구\n  2. 오류 등이 있을 경우 정정 요구\n  3. 삭제요구\n  4. 처리정지 요구',
  },
  {
    title: '제7조 (개인정보의 안전성 확보 조치)',
    body: '회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.\n\n  1. 관리적 조치\n     내부관리계획 수립·시행,\n     정기적 직원 교육\n\n  2. 기술적 조치\n     개인정보처리시스템 등의 접근권한\n     관리, 접근통제시스템 설치,\n     고유식별정보 등의 암호화,\n     보안프로그램 설치\n\n  3. 물리적 조치\n     전산실, 자료보관실 등의 접근통제',
  },
  {
    title: '제8조 (개인정보 보호책임자)',
    body: '회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.\n\n  ▶ 개인정보 보호책임자\n\n  • 성명: 김무성\n  • 직책: 이사\n  • 연락처: 02-597-1811\n  • 이메일: gp@goldenplanet.co.kr',
  },
  {
    title: '제9조 (개인정보 처리방침 변경)',
    body: '이 개인정보처리방침은 2026년 2월 25일부터\n적용됩니다.\n\n변경사항이 있을 경우 시행일 7일 전부터 앱 내 공지사항을 통하여 고지할 것입니다.',
  },
]

// ========================
// 약관 동의 화면
// ========================
export default function TermsScreen() {
  const params = useLocalSearchParams<{ viewOnly?: string }>()
  const viewOnly = params.viewOnly === '1'
  const { isDark } = useTheme()
  const [step, setStep] = useState<'terms' | 'privacy'>('terms')
  const [termsScrolledToEnd, setTermsScrolledToEnd] = useState(false)
  const [privacyScrolledToEnd, setPrivacyScrolledToEnd] = useState(false)
  const scrollViewRef = useRef<import('react-native').ScrollView>(null)

  const isScrolledToEnd = step === 'terms' ? termsScrolledToEnd : privacyScrolledToEnd
  const articles = step === 'terms' ? TERMS_ARTICLES : PRIVACY_ARTICLES
  const title = step === 'terms' ? '이용약관' : '개인정보처리방침'
  const stepText = step === 'terms' ? '1 / 2' : '2 / 2'

  useEffect(() => {
    const readConsentState = async () => {
      const consentState = await getConsentState()

      if (!viewOnly && consentState.policiesAccepted) {
        const session = await getAuthSession()
        router.replace(session?.accessToken?.trim() ? '/(tabs)/home' : '/(auth)/login')
      }
    }

    readConsentState()
  }, [viewOnly])

  // Android는 contentSize/onScroll 보고가 다르거나 스크롤 종료 시점에만 정확할 수 있음 → 끝 감지 로직 공통화
  const checkScrolledToEnd = (e: NativeScrollEvent) => {
    const { layoutMeasurement, contentOffset, contentSize } = e
    const threshold = 80
    const isEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold
    return isEnd
  }

  const applyScrolledToEnd = () => {
    if (step === 'terms') setTermsScrolledToEnd(true)
    else setPrivacyScrolledToEnd(true)
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (checkScrolledToEnd(event.nativeEvent)) applyScrolledToEnd()
  }

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (checkScrolledToEnd(event.nativeEvent)) applyScrolledToEnd()
  }

  const handleBack = () => {
    if (step === 'privacy') {
      setStep('terms')
      scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    }
  }

  const handleAgree = async () => {
    if (viewOnly) {
      router.back()
      return
    }
    if (step === 'terms') {
      await setTermsAccepted(true)
      setStep('privacy')
      scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    } else {
      await setPrivacyAccepted(true)
      await setPoliciesAccepted(true)
      const session = await getAuthSession()
      router.replace(session?.accessToken?.trim() ? '/(tabs)/home' : '/(auth)/login')
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark'>
      {/* Header */}
      <View className='px-5 pt-4 pb-2'>
        <View className='flex-row items-center justify-between mb-1'>
          <View className='flex-row items-center gap-3'>
            {step === 'privacy' && (
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <ChevronLeft size={28} color={isDark ? '#C5C5C5' : '#000000'} strokeWidth={2} />
              </Pressable>
            )}
            <Text className='font-bold text-title-2 text-content dark:text-content-dark'>
              {title}
            </Text>
          </View>
          <View
            className='px-3 py-1.5 rounded-full'
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}
          >
            <Text className='font-normal text-headline' style={{ color: isDark ? '#C5C5C5' : '#000000' }}>
              {stepText}
            </Text>
          </View>
        </View>
        <Text className='mt-1 text-subhead text-content-tertiary'>
          {viewOnly ? '아래에서 이용약관과 개인정보처리방침을 확인할 수 있습니다.' : '아래 내용을 끝까지 읽어주신 후 동의해 주세요.'}
        </Text>
      </View>

      {/* Content - 미니멀 통일: 얇은 보더라인 */}
      <View
        className='flex-1 mx-5 my-3 overflow-hidden bg-card dark:bg-card-dark rounded-xl'
        style={{
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(56,56,58,0.8)' : 'rgba(0,0,0,0.1)',
        }}
      >
        <ScreenScroll
          ref={scrollViewRef}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={100}
          className='flex-1 px-5 py-4'
        >
          {articles.map((article, index) => (
            <View key={index}>
              {article.title ? <ArticleTitle>{article.title}</ArticleTitle> : null}
              <ArticleBody>{article.body}</ArticleBody>
              {index < articles.length - 1 && (
                <View className='my-4 border-b border-border dark:border-border-dark' />
              )}
            </View>
          ))}
          <View className='h-6' />
        </ScreenScroll>

        {/* Scroll indicator - 탭 시 맨 밑으로 스크롤. 다크/라이트 공통: 배경·텍스트 명확하게(opacity 높임) */}
        {!isScrolledToEnd && (
          <Pressable
            className='absolute bottom-0 left-0 right-0 items-center pt-8 pb-2'
            onPress={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true })
              if (step === 'terms') setTermsScrolledToEnd(true)
              else setPrivacyScrolledToEnd(true)
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View
              className='flex-row items-center gap-1 px-4 py-2.5 rounded-full'
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)',
              }}
            >
              <ChevronDown size={14} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2} />
              <Text className='font-medium text-caption-1' style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
                아래로 스크롤
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Bottom Button - 미니멀 통일: 콘텐츠 박스와 동일한 얇은 보더 */}
      <View className='px-5 pb-4'>
        <Button
          title={
            viewOnly
              ? '확인'
              : step === 'terms'
                ? '동의하고 계속하기'
                : '동의하고 시작하기'
          }
          onPress={handleAgree}
          fullWidth
          size='lg'
          disabled={!viewOnly && !isScrolledToEnd}
          className={
            [
              'rounded-xl',
              !viewOnly && !isScrolledToEnd ? 'opacity-40' : '',
              'border',
              isDark ? 'border-[rgba(56,56,58,0.8)]' : 'border-[rgba(0,0,0,0.1)]',
            ].filter(Boolean).join(' ')
          }
        />
      </View>
    </SafeAreaView>
  )
}
