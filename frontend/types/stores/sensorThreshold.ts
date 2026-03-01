export type SensorThresholdValue = {
  min: number | null
  max: number | null
}

export type SensorThresholdDraft = {
  minInput: string
  maxInput: string
}

export type SensorThresholdModalState = {
  isEditorModalVisible: boolean
  isConfirmStepVisible: boolean
  activeSensorType: string | null
  draft: SensorThresholdDraft
  errorMessage: string | null
  pendingValue: SensorThresholdValue | null
}

export interface SensorThresholdStore {
  sensorThresholds: Record<string, SensorThresholdValue>
  modal: SensorThresholdModalState
  openEditorModal: (sensorType: string, draft: SensorThresholdDraft) => void
  closeEditorModal: () => void
  openConfirmStep: (value: SensorThresholdValue) => void
  closeConfirmStep: () => void
  setDraftMinInput: (value: string) => void
  setDraftMaxInput: (value: string) => void
  setModalErrorMessage: (message: string | null) => void
  confirmSaveThreshold: () => void
}
