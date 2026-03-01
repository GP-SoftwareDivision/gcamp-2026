import type {
  SensorThresholdDraft,
  SensorThresholdModalState,
  SensorThresholdStore,
} from '@/types/stores'
import { create } from 'zustand'

const INITIAL_DRAFT: SensorThresholdDraft = {
  minInput: '',
  maxInput: '',
}

const INITIAL_MODAL_STATE: SensorThresholdModalState = {
  isEditorModalVisible: false,
  isConfirmStepVisible: false,
  activeSensorType: null,
  draft: { ...INITIAL_DRAFT },
  errorMessage: null,
  pendingValue: null,
}

export const useSensorThresholdStore = create<SensorThresholdStore>((set, get) => ({
  sensorThresholds: {},
  modal: INITIAL_MODAL_STATE,
  openEditorModal: (sensorType, draft) =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        isEditorModalVisible: true,
        isConfirmStepVisible: false,
        activeSensorType: sensorType,
        draft,
        errorMessage: null,
        pendingValue: null,
      },
    })),
  closeEditorModal: () =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        isEditorModalVisible: false,
        isConfirmStepVisible: false,
        activeSensorType: null,
        draft: { ...INITIAL_DRAFT },
        errorMessage: null,
        pendingValue: null,
      },
    })),
  openConfirmStep: (value) =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        isConfirmStepVisible: true,
        errorMessage: null,
        pendingValue: value,
      },
    })),
  closeConfirmStep: () =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        isConfirmStepVisible: false,
        pendingValue: null,
      },
    })),
  setDraftMinInput: (value) =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        draft: { ...state.modal.draft, minInput: value },
        errorMessage: null,
      },
    })),
  setDraftMaxInput: (value) =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        draft: { ...state.modal.draft, maxInput: value },
        errorMessage: null,
      },
    })),
  setModalErrorMessage: (message) =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        errorMessage: message,
      },
    })),
  confirmSaveThreshold: () => {
    const { modal } = get()
    if (!modal.activeSensorType || !modal.pendingValue) return
    const activeSensorType = modal.activeSensorType
    const pendingValue = modal.pendingValue

    set((state) => ({
      sensorThresholds: (() => {
        const next = { ...state.sensorThresholds }
        const value = pendingValue

        if (value.min == null && value.max == null) {
          delete next[activeSensorType]
          return next
        }

        next[activeSensorType] = value
        return next
      })(),
      modal: {
        ...state.modal,
        isEditorModalVisible: false,
        isConfirmStepVisible: false,
        activeSensorType: null,
        draft: { ...INITIAL_DRAFT },
        pendingValue: null,
        errorMessage: null,
      },
    }))
  },
}))
