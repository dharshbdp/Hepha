import { ElectronAPI } from '@electron-toolkit/preload'
import type { HephaAPI } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: HephaAPI
  }
}
