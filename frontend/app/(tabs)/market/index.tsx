import { useFocusEffect } from '@react-navigation/native'
import { Button, Card, ScreenLoader, ScreenScroll, SectionLabel, TabHeader } from '@/components/ui'
import { useMarketRecentlySWR } from '@/hooks/swr'
import {
  MARKET_CATEGORY_FILTER_OPTIONS,
  type MarketCategoryFilterId,
  filterMarketSectionsByCategory,
} from '@/shared/marketCategory'
import { useMarketStore } from '@/store/marketStore'
import { router } from 'expo-router'
import { Search } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function getItemNameFromLabel(label: string, fallback: string): string {
  const index = label.lastIndexOf('(')
  if (index <= 0) return fallback
  return label.slice(0, index).trim() || fallback
}

export default function MarketListScreen() {
  const [selectedCategory, setSelectedCategory] = useState<MarketCategoryFilterId>('all')
  const sections = useMarketStore((state) => state.sections)
  const isLoadingStore = useMarketStore((state) => state.isLoading)
  const fetchRecentlyPrices = useMarketStore((state) => state.fetchRecentlyPrices)
  const setSelectedQuery = useMarketStore((state) => state.setSelectedQuery)

  const { isValidating } = useMarketRecentlySWR()
  const isLoading = isLoadingStore || (isValidating && sections.length === 0)
  const filteredSections = filterMarketSectionsByCategory(sections, selectedCategory)

  const handleRefetch = async () => {
    await fetchRecentlyPrices({ force: true })
  }

  useFocusEffect(() => {
    fetchRecentlyPrices({ force: true }).catch(() => undefined)
  })

  return (
    <SafeAreaView className='flex-1 bg-background dark:bg-background-dark' edges={['top']}>
      <TabHeader
        title='출하시기'
        rightAction={{
          icon: <Search size={18} color='#8E8E93' strokeWidth={2} />,
          onPress: () => router.push('/market/search'),
          accessibilityLabel: '시장 검색 화면으로 이동',
        }}
      />
      <ScreenScroll
        className='flex-1'
        onRefetch={handleRefetch}
        contentContainerClassName='px-5 pt-2 pb-24'
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className='mb-4'
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {MARKET_CATEGORY_FILTER_OPTIONS.map((option) => {
            const isSelected = selectedCategory === option.id

            return (
              <Button
                key={option.id}
                title={option.label}
                size='sm'
                variant={isSelected ? 'primary' : 'secondary'}
                className='h-[44px] rounded-2xl px-5'
                onPress={() => setSelectedCategory(option.id)}
              />
            )
          })}
        </ScrollView>

        {isLoading && sections.length === 0 ? <ScreenLoader fullScreen={false} /> : null}

        {!isLoading && filteredSections.length === 0 ? (
          <View className='rounded-2xl border border-border bg-card px-4 py-5 dark:border-border-dark dark:bg-card-dark'>
            <Text className='text-subhead text-content-secondary dark:text-content-dark-secondary'>
              선택한 품목의 시세가 없습니다.
            </Text>
          </View>
        ) : null}

        {filteredSections.map((section, sectionIndex) => {
          const sectionClassName = sectionIndex < filteredSections.length - 1 ? 'mb-2' : ''

          return (
            <View key={section.title} className={sectionClassName}>
              <SectionLabel title={section.title} />

              {Array.from(
                { length: Math.ceil(section.grades.length / 2) },
                (_, idx) => idx * 2,
              ).map((rowStart) => (
                <View key={rowStart} className='mb-5 flex-row gap-3'>
                  {section.grades.slice(rowStart, rowStart + 2).map((item) => {
                    const diff = item.price - item.prevPrice
                    const percent =
                      item.prevPrice > 0 ? Math.round((diff / item.prevPrice) * 100) : 0
                    const isUp = diff > 0
                    const isDown = diff < 0

                    return (
                      <Card
                        key={`${section.title}-${item.id}`}
                        className='flex-1'
                        label={item.label}
                        onPress={() => {
                          const itemName = getItemNameFromLabel(item.label, section.title)
                          setSelectedQuery({
                            itemCode: item.itemCode,
                            gradeName: item.gradeName,
                            itemName,
                            unitName: item.unitName,
                          })

                          router.push({
                            pathname: '/(tabs)/market/[grade]',
                            params: {
                              grade: item.gradeName,
                              gradeName: item.gradeName,
                              itemCode: item.itemCode,
                              itemName,
                              unitName: item.unitName,
                            },
                          })
                        }}
                      >
                        <View className='flex-row items-baseline gap-2'>
                          <View className='flex-row items-end'>
                            <Text className='text-[28px] font-medium text-content dark:text-content-dark'>
                              {item.price.toLocaleString()}
                            </Text>
                            <Text className='ml-1 text-base font-normal text-content-secondary dark:text-content-dark-secondary'>
                              원
                            </Text>
                          </View>
                          <Text
                            className={`text-body font-medium ${
                              isUp
                                ? 'text-danger'
                                : isDown
                                  ? 'text-info'
                                  : 'text-content-tertiary dark:text-content-dark-secondary'
                            }`}
                          >
                            {isUp ? '+' : isDown ? '-' : ''}
                            {Math.abs(percent)}%
                          </Text>
                        </View>
                      </Card>
                    )
                  })}
                </View>
              ))}
            </View>
          )
        })}
      </ScreenScroll>
    </SafeAreaView>
  )
}
