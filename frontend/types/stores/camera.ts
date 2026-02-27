export interface CameraUiStore {
  isFullscreen: boolean
  isConnecting: boolean
  isStreamReady: boolean
  connectionIssueMessage: string | null
  ipcamAddress: string | null

  setFullscreen: (value: boolean) => void
  toggleFullscreen: () => void
  setIpcamAddress: (value: string | null | undefined) => void
  startConnecting: () => void
  markStreamReady: () => void
  resetStreamState: () => void
  markStreamError: () => void
  setConnectionTimeoutIssue: () => void
}
