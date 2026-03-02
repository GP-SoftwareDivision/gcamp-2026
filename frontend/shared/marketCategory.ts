export type MarketCategoryFilterId =
  | 'all'
  | 'jujubeCherryTomato'
  | 'cherryTomato'
  | 'tomato'
  | 'ripeTomato'

export type MarketCategoryFilterOption = {
  id: MarketCategoryFilterId
  label: string
}

export const MARKET_CATEGORY_FILTER_OPTIONS: MarketCategoryFilterOption[] = [
  { id: 'all', label: '전체' },
  { id: 'jujubeCherryTomato', label: '대추방울 토마토' },
  { id: 'cherryTomato', label: '방울토마토' },
  { id: 'tomato', label: '토마토' },
  { id: 'ripeTomato', label: '토마토 완숙' },
]

function normalizeCategorySourceText(value: string): string {
  return value.replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase()
}

export function matchesMarketSectionCategory(
  sectionTitle: string,
  sampleGradeLabel: string | undefined,
  selectedCategory: MarketCategoryFilterId,
): boolean {
  if (selectedCategory === 'all') return true

  const source = normalizeCategorySourceText(`${sectionTitle} ${sampleGradeLabel ?? ''}`)

  if (source.includes('대추방울토마토')) {
    return selectedCategory === 'jujubeCherryTomato'
  }

  if (source.includes('방울토마토')) {
    return selectedCategory === 'cherryTomato'
  }

  if (source.includes('토마토')) {
    const isRipeTomato = source.includes('완숙')
    if (isRipeTomato) return selectedCategory === 'ripeTomato'
    return selectedCategory === 'tomato'
  }

  return false
}

type MarketCategorySection = {
  title: string
  grades: { label: string }[]
}

export function filterMarketSectionsByCategory<T extends MarketCategorySection>(
  sections: T[],
  selectedCategory: MarketCategoryFilterId,
): T[] {
  return sections.filter((section) =>
    matchesMarketSectionCategory(section.title, section.grades[0]?.label, selectedCategory),
  )
}
