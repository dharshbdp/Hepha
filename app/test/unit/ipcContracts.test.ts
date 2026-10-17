import { describe, it, expect } from 'vitest'
import type {
  HephaAPI,
  SaveProjectResult,
  OpenProjectResult,
  CompileResult,
  UploadResult,
  ToolchainStatus,
  ConnectionState
} from '../../src/shared/types'

describe('IPC Contract Signatures & Response Models (ipcContracts)', () => {
  it('validates SaveProjectResult contract shape', () => {
    const successResult: SaveProjectResult = {
      success: true,
      filePath: 'C:/Projects/demo.hepha'
    }
    expect(successResult.success).toBe(true)
    expect(successResult.filePath).toBeDefined()
    expect(successResult.canceled).toBeUndefined()

    const canceledResult: SaveProjectResult = {
      success: false,
      canceled: true
    }
    expect(canceledResult.success).toBe(false)
    expect(canceledResult.canceled).toBe(true)
  })

  it('validates OpenProjectResult contract shape with HephaProject', () => {
    const openResult: OpenProjectResult = {
      success: true,
      filePath: 'C:/Projects/demo.hepha',
      project: {
        formatVersion: '1.0',
        name: 'Demo',
        boardId: 'arduino_uno',
        baudRate: 115200,
        workspace: {},
        createdAt: '2026-10-17T00:00:00.000Z',
        updatedAt: '2026-10-17T00:00:00.000Z'
      }
    }
    expect(openResult.success).toBe(true)
    expect(openResult.project?.formatVersion).toBe('1.0')
  })

  it('validates ToolchainStatus contract shape', () => {
    const status: ToolchainStatus = {
      installed: true,
      cliPath: 'C:/tools/arduino-cli.exe',
      cores: ['arduino:avr@1.8.6', 'esp32:esp32@2.0.17']
    }
    expect(status.installed).toBe(true)
    expect(status.cores).toContain('arduino:avr@1.8.6')
  })

  it('validates CompileResult and UploadResult contracts', () => {
    const compile: CompileResult = {
      success: true,
      output: 'Sketch uses 1024 bytes',
      binaryPath: 'C:/temp/build/hepha_sketch.hex'
    }
    expect(compile.success).toBe(true)
    expect(compile.binaryPath).toBeDefined()

    const upload: UploadResult = {
      success: true,
      output: 'avrdude done. Thank you.'
    }
    expect(upload.success).toBe(true)
  })

  it('validates ConnectionState model', () => {
    const state: ConnectionState = {
      connected: true,
      portPath: 'COM3',
      baudRate: 115200
    }
    expect(state.connected).toBe(true)
    expect(state.portPath).toBe('COM3')
  })

  it('verifies that all essential HephaAPI methods are mapped in the contract interface', () => {
    // Assert keys exist on a mock API conforming to HephaAPI
    const mockApi: Record<keyof HephaAPI, boolean> = {
      listSerialPorts: true,
      connectSerial: true,
      disconnectSerial: true,
      sendSerialData: true,
      getConnectionState: true,
      onSerialData: true,
      onConnectionStateChange: true,
      checkToolchain: true,
      installToolchain: true,
      compileSketch: true,
      uploadSketch: true,
      onToolchainLog: true,
      saveProject: true,
      openProject: true,
      explainCircuit: true,
      setAiApiKey: true,
      getAiApiKeyStatus: true,
      synthesizeBlocks: true,
      transpileSketch: true
    }

    expect(Object.keys(mockApi).length).toBe(19)
    expect(mockApi.saveProject).toBe(true)
    expect(mockApi.openProject).toBe(true)
  })
})
