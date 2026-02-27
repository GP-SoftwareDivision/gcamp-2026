import { useTheme } from '@/hooks/theme'
import { Dropdown } from 'react-native-element-dropdown'
import { Text, View } from 'react-native'

type SelectItem = {
  // 사용자에게 보여줄 텍스트
  label: string
  // 실제 저장/전달할 값
  value: string | number | Record<string, string> | null
}

type SelectProps = {
  // 드롭다운 목록 데이터
  data: SelectItem[]
  // 현재 선택된 값
  value: string | number | Record<string, string> | null
  // 항목 선택 시 호출
  onChange: (item: SelectItem) => void
  // 선택 전 안내 문구
  placeholder?: string
  // Select 크기
  size?: 'md' | 'lg'
  // 추가 클래스
  className?: string
}

// 공통 Select/Dropdown 래퍼 컴포넌트
// NativeWind 스타일은 래퍼 컨테이너에 적용하고, Dropdown 내부는 최소 style로 정렬합니다.
export function Select({
  data,
  value,
  onChange,
  placeholder = '선택해 주세요',
  size = 'md',
  className = '',
}: SelectProps) {
  const { isDark } = useTheme()
  const controlHeight = size === 'lg' ? 52 : 46
  const textSize = size === 'lg' ? 16 : 15

  return (
    <View
      className={`rounded-2xl border border-border bg-card px-3 dark:border-border-dark dark:bg-card-dark ${className}`.trim()}
    >
      <Dropdown
        data={data}
        value={value}
        valueField='value'
        labelField='label'
        placeholder={placeholder}
        onChange={(item) => onChange(item as SelectItem)}
        style={{ height: controlHeight }}
        containerStyle={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        }}
        itemContainerStyle={{ borderRadius: 10 }}
        selectedTextStyle={{
          fontSize: textSize,
          color: isDark ? '#FFFFFF' : '#1C1C1E',
        }}
        placeholderStyle={{
          fontSize: textSize,
          color: isDark ? '#8E8E93' : '#6B7280',
        }}
        itemTextStyle={{
          fontSize: textSize,
          color: isDark ? '#FFFFFF' : '#1C1C1E',
        }}
        activeColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
        renderItem={(item) => (
          <View className='px-3 py-2'>
            <Text className='text-body text-content dark:text-content-dark'>{item.label}</Text>
          </View>
        )}
      />
    </View>
  )
}

export type { SelectProps, SelectItem }
