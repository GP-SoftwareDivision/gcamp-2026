import { farmApi, sensorApi } from '@/services/api'
import {
  buildSensorThresholdSyncPlans,
  toSensorLimitApiSensorType,
} from '@/shared/sensorThreshold'
import type {
  SensorThresholdDraft,
  SensorThresholdModalState,
  SensorThresholdStore,
} from '@/types/stores'
import { isAxiosError } from 'axios'
import { create } from 'zustand'

const INITIAL_DRAFT: SensorThresholdDraft = {
  minInput: '',
  maxInput: '',
}

const INITIAL_MODAL_STATE: SensorThresholdModalState = {
  isEditorModalVisible: false,
  isConfirmStepVisible: false,
  isSaving: false,
  activeSensorType: null,
  draft: { ...INITIAL_DRAFT },
  errorMessage: null,
  pendingValue: null,
}

function getThresholdApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const apiMessage = error.response?.data?.message
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      const normalizedMessage = apiMessage.toLowerCase()
      if (normalizedMessage.includes('already exists')) {
        return '이미 등록된 임계치입니다. 다시 시도해 주세요.'
      }
      return apiMessage
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
    }
    return '임계치 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return '임계치 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

function isLimitAlreadyExistsError(error: unknown): boolean {
  if (!isAxiosError(error)) return false

  const status = error.response?.status
  if (status === 409) return true
  if (status !== 400) return false

  const message = error.response?.data?.message
  if (typeof message !== 'string') return false
  return message.toLowerCase().includes('already exists')
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
        isSaving: false,
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
        isSaving: false,
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
        isSaving: false,
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
        isSaving: false,
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
  confirmSaveThreshold: async () => {
    const { modal, sensorThresholds } = get()
    if (!modal.activeSensorType || !modal.pendingValue) return false

    const activeSensorType = modal.activeSensorType
    const pendingValue = modal.pendingValue
    const previousValue = sensorThresholds[activeSensorType]
    const syncPlans = buildSensorThresholdSyncPlans(previousValue, pendingValue)
    console.log('[sensor/limit] sync start', {
      activeSensorType,
      previousValue,
      pendingValue,
      syncPlans,
    })

    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        isSaving: true,
        errorMessage: null,
      },
    }))

    try {
      if (syncPlans.length > 0) {
        const profile = await farmApi.getMyFarmProfile()
        const mac = profile?.mac?.trim()
        if (!mac) {
          throw new Error('센서 식별 정보(mac)를 불러오지 못했습니다.')
        }

        const apiSensorType = toSensorLimitApiSensorType(activeSensorType)
        console.log('[sensor/limit] resolved target', { mac, apiSensorType, activeSensorType })

        for (const plan of syncPlans) {
          console.log('[sensor/limit] apply plan', plan)
          if (plan.action === 'delete') {
            try {
              await sensorApi.deleteSensorLimit({
                mac,
                sensorType: apiSensorType,
                limitType: plan.limitType,
              })
            } catch (error) {
              if (isAxiosError(error) && error.response?.status === 404) {
                console.log('[sensor/limit] delete skipped (404)', {
                  mac,
                  apiSensorType,
                  limitType: plan.limitType,
                })
                continue
              }
              throw error
            }
            continue
          }

          const payload = {
            mac,
            sensorType: apiSensorType,
            limitType: plan.limitType,
            sensorLimitValue: plan.value as number,
            useFlag: true,
          }

          if (plan.action === 'create') {
            try {
              await sensorApi.createSensorLimit(payload)
            } catch (error) {
              if (isLimitAlreadyExistsError(error)) {
                console.log('[sensor/limit] create conflict -> update fallback', payload)
                try {
                  await sensorApi.updateSensorLimit(payload)
                } catch (updateError) {
                  const updateStatus = isAxiosError(updateError)
                    ? updateError.response?.status
                    : undefined
                  if (updateStatus === 404 || updateStatus === 500) {
                    console.log('[sensor/limit] create->update failed -> delete+create fallback', {
                      payload,
                      updateStatus,
                    })
                    try {
                      await sensorApi.deleteSensorLimit({
                        mac,
                        sensorType: apiSensorType,
                        limitType: plan.limitType,
                      })
                    } catch (deleteError) {
                      const deleteStatus = isAxiosError(deleteError)
                        ? deleteError.response?.status
                        : undefined
                      if (deleteStatus !== 404) {
                        throw deleteError
                      }
                    }
                    await sensorApi.createSensorLimit(payload)
                  } else {
                    throw updateError
                  }
                }
              } else {
                throw error
              }
            }
          } else {
            console.log('[sensor/limit] update plan -> delete+create strategy', payload)
            try {
              await sensorApi.deleteSensorLimit({
                mac,
                sensorType: apiSensorType,
                limitType: plan.limitType,
              })
            } catch (deleteError) {
              const deleteStatus = isAxiosError(deleteError)
                ? deleteError.response?.status
                : undefined
              if (deleteStatus !== 404) {
                throw deleteError
              }
            }
            try {
              await sensorApi.createSensorLimit(payload)
            } catch (createError) {
              const createStatus = isAxiosError(createError)
                ? createError.response?.status
                : undefined
              if (createStatus === 409) {
                console.log('[sensor/limit] update strategy conflict -> retry update', {
                  payload,
                  createStatus,
                })
                await sensorApi.updateSensorLimit(payload)
              } else {
                throw createError
              }
            }
          }
        }
      } else {
        console.log('[sensor/limit] no remote sync required (no changes)')
      }

      set((state) => ({
        sensorThresholds: (() => {
          const next = { ...state.sensorThresholds }
          if (pendingValue.min == null && pendingValue.max == null) {
            delete next[activeSensorType]
            return next
          }
          next[activeSensorType] = pendingValue
          return next
        })(),
        modal: {
          ...state.modal,
          isEditorModalVisible: false,
          isConfirmStepVisible: false,
          isSaving: false,
          activeSensorType: null,
          draft: { ...INITIAL_DRAFT },
          pendingValue: null,
          errorMessage: null,
        },
      }))
      console.log('[sensor/limit] sync success')
      return true
    } catch (error) {
      console.log('[sensor/limit] sync failed', {
        status: isAxiosError(error) ? error.response?.status : undefined,
        message: error instanceof Error ? error.message : String(error),
      })
      set((state) => ({
        ...state,
        modal: {
          ...state.modal,
          isSaving: false,
          errorMessage: getThresholdApiErrorMessage(error),
        },
      }))
      return false
    }
  },
}))
