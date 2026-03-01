import type { MarketSearchSelectOption } from '@/types/pages/tabs'

export type SearchStep = 'item' | 'unit' | 'grade' | 'date' | 'done'
export type DateInputStep = 'start' | 'end'

export type ConfirmedDateBadges = {
  start: boolean
  end: boolean
}

export type CompletedSteps = {
  item: boolean
  unit: boolean
  grade: boolean
  date: boolean
}

export type MarketSearchUiState = {
  isStartPickerOpen: boolean
  isEndPickerOpen: boolean
  activeStep: SearchStep
  dateInputStep: DateInputStep
  completedSteps: CompletedSteps
  confirmedDateBadges: ConfirmedDateBadges
}

const INITIAL_COMPLETED_STEPS: CompletedSteps = {
  item: false,
  unit: false,
  grade: false,
  date: false,
}

const INITIAL_CONFIRMED_DATE_BADGES: ConfirmedDateBadges = {
  start: false,
  end: false,
}

function cloneCompletedSteps(source: CompletedSteps): CompletedSteps {
  return {
    item: source.item,
    unit: source.unit,
    grade: source.grade,
    date: source.date,
  }
}

function cloneConfirmedDateBadges(source: ConfirmedDateBadges): ConfirmedDateBadges {
  return {
    start: source.start,
    end: source.end,
  }
}

export function createInitialCompletedSteps(): CompletedSteps {
  return cloneCompletedSteps(INITIAL_COMPLETED_STEPS)
}

export function createInitialConfirmedDateBadges(): ConfirmedDateBadges {
  return cloneConfirmedDateBadges(INITIAL_CONFIRMED_DATE_BADGES)
}

export function createDefaultMarketSearchUiState(): MarketSearchUiState {
  return {
    isStartPickerOpen: false,
    isEndPickerOpen: false,
    activeStep: 'item',
    dateInputStep: 'start',
    completedSteps: createInitialCompletedSteps(),
    confirmedDateBadges: createInitialConfirmedDateBadges(),
  }
}

export function createPresetMarketSearchUiState(): MarketSearchUiState {
  return {
    isStartPickerOpen: false,
    isEndPickerOpen: false,
    activeStep: 'date',
    dateInputStep: 'start',
    completedSteps: {
      item: true,
      unit: true,
      grade: true,
      date: false,
    },
    confirmedDateBadges: createInitialConfirmedDateBadges(),
  }
}

export function getNextStepFromCompletion(steps: CompletedSteps): SearchStep {
  if (!steps.unit) return 'unit'
  if (!steps.grade) return 'grade'
  if (!steps.date) return 'date'
  return 'done'
}

export function getSelectedOptionLabel(
  options: MarketSearchSelectOption[],
  value: string,
  fallbackLabel?: string | null,
): string {
  return options.find((option) => option.value === value)?.label ?? fallbackLabel ?? '전체'
}
