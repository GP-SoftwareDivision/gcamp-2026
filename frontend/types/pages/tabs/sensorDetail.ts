import type { SensorThresholdUiAction } from '@/shared/sensorThreshold'
import type { SensorChartData } from '@/shared/sensorDetail'
import type { SensorThresholdDraft, SensorThresholdValue } from '@/types/stores'

export type SensorInfo = {
  label: string
  unit: string
}

export interface SensorLineChartProps {
  data: SensorChartData
  isDark: boolean
  unit: string
}

export interface SensorThresholdModalProps {
  visible: boolean
  isDark: boolean
  isConfirmStepVisible: boolean
  isSaving: boolean
  sensorInfo: SensorInfo
  sensorUnit: string
  thresholdDraft: SensorThresholdDraft
  thresholdErrorMessage: string | null
  thresholdKeyboardType: 'decimal-pad' | 'numeric'
  currentThresholdLabel: string
  appliedThreshold: SensorThresholdValue | undefined
  confirmActionType: SensorThresholdUiAction
  confirmActionTitle: string
  confirmActionMessage: string
  confirmActionButtonLabel: string
  confirmMinValueLabel: string
  confirmMaxValueLabel: string
  editActionButtonLabel: string
  isEditActionDisabled: boolean
  onClose: () => void
  onCancelConfirmStep: () => void
  onConfirmSaveThreshold: () => void
  onRequestSaveThreshold: () => void
  onRequestResetThreshold: () => void
  onChangeMinInput: (value: string) => void
  onChangeMaxInput: (value: string) => void
}
