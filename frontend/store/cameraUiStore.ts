import type { CameraUiStore } from '@/types/stores'
import { create } from 'zustand'

const INITIAL_STATE = {
  isFullscreen: false,
  isConnecting: true,
  isStreamReady: false,
  connectionIssueMessage: null as string | null,
  ipcamAddress: null as string | null,
}

export const useCameraUiStore = create<CameraUiStore>((set) => ({
  ...INITIAL_STATE,
  setFullscreen: (value) => set({ isFullscreen: value }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  setIpcamAddress: (value) =>
    set({
      ipcamAddress: typeof value === 'string' && value.trim().length > 0 ? value.trim() : null,
    }),
  startConnecting: () =>
    set({
      isConnecting: true,
      isStreamReady: false,
      connectionIssueMessage: null,
    }),
  markStreamReady: () =>
    set({ isStreamReady: true, isConnecting: false, connectionIssueMessage: null }),
  resetStreamState: () =>
    set({ isConnecting: true, isStreamReady: false, connectionIssueMessage: null }),
  markStreamError: () =>
    set({
      isConnecting: false,
      isStreamReady: false,
      connectionIssueMessage: '카메라에 접속할 수 없습니다. 네트워크 상태와 RTSP 주소를 확인해 주세요.',
    }),
  setConnectionTimeoutIssue: () =>
    set((state) => {
      if (state.isStreamReady) return state
      return {
        ...state,
        isConnecting: false,
        connectionIssueMessage:
          '1분 이상 연결이 지연되고 있습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
      }
    }),
}))
