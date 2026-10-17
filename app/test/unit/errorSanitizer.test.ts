import { describe, it, expect } from 'vitest'
import { sanitizeDiagnosticsText, sanitizeError } from '../../src/main/diagnostics/errorSanitizer'

describe('Privacy-Preserving Crash Diagnostics (errorSanitizer)', () => {
  describe('sanitizeDiagnosticsText', () => {
    it('redacts Google Gemini API keys', () => {
      const raw = 'Failed to authenticate: AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q'
      const sanitized = sanitizeDiagnosticsText(raw)
      expect(sanitized).not.toContain('AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q')
      expect(sanitized).toContain('[REDACTED_GEMINI_KEY]')
    })

    it('redacts OpenAI secret keys', () => {
      const raw = 'Header authorization failed for sk-abcdef1234567890abcdef1234567890'
      const sanitized = sanitizeDiagnosticsText(raw)
      expect(sanitized).not.toContain('sk-abcdef1234567890abcdef1234567890')
      expect(sanitized).toContain('[REDACTED_API_TOKEN]')
    })

    it('redacts Windows user home directory paths', () => {
      const raw = 'Error: Cannot find file at C:\\Users\\AliceCooper\\Documents\\sketch.ino'
      const sanitized = sanitizeDiagnosticsText(raw)
      expect(sanitized).not.toContain('AliceCooper')
      expect(sanitized).toContain('~\\Documents\\sketch.ino')
    })

    it('redacts Unix / macOS user home directory paths', () => {
      const macRaw = 'Error opening /Users/charlie/Documents/workspace.hepha'
      const linuxRaw = 'Error opening /home/david/repo/project.hepha'
      expect(sanitizeDiagnosticsText(macRaw)).not.toContain('charlie')
      expect(sanitizeDiagnosticsText(macRaw)).toContain('~/Documents/workspace.hepha')
      expect(sanitizeDiagnosticsText(linuxRaw)).not.toContain('david')
      expect(sanitizeDiagnosticsText(linuxRaw)).toContain('~/repo/project.hepha')
    })

    it('redacts query parameter auth tokens from URLs', () => {
      const raw =
        'GET https://generativelanguage.googleapis.com/v1/models?key=AIzaSySecretTokenValue123'
      const sanitized = sanitizeDiagnosticsText(raw)
      expect(sanitized).not.toContain('AIzaSySecretTokenValue123')
      expect(sanitized).toContain('key=[REDACTED')
    })
  })

  describe('sanitizeError categorization & remediation hints', () => {
    it('categorizes locked serial port errors with port troubleshooting hint', () => {
      const err = new Error('Access is denied: COM3 port busy')
      const diag = sanitizeError(err)
      expect(diag.category).toBe('HARDWARE_PORT')
      expect(diag.actionableHint).toContain('serial COM port is locked')
    })

    it('categorizes missing arduino-cli compiler errors with toolchain hint', () => {
      const err = new Error('spawn arduino-cli ENOENT: executable not found')
      const diag = sanitizeError(err)
      expect(diag.category).toBe('COMPILER_TOOLCHAIN')
      expect(diag.actionableHint).toContain('arduino-cli')
    })

    it('categorizes missing core platform errors with board package hint', () => {
      const err = new Error('Platform esp32:esp32 not installed')
      const diag = sanitizeError(err)
      expect(diag.category).toBe('COMPILER_TOOLCHAIN')
      expect(diag.actionableHint).toContain('Toolchain Management')
    })

    it('categorizes AI service quota or key errors and redacts key from message', () => {
      const err = new Error(
        'Gemini API call failed with key AIzaSyFakeApiKeyTesting1234567890123: Quota exceeded'
      )
      const diag = sanitizeError(err)
      expect(diag.category).toBe('AI_SERVICE')
      expect(diag.sanitizedMessage).not.toContain('AIzaSyFakeApiKeyTesting1234567890123')
      expect(diag.sanitizedMessage).toContain('[REDACTED_GEMINI_KEY]')
      expect(diag.actionableHint).toContain('API key in settings')
    })

    it('categorizes file system I/O errors', () => {
      const err = new Error('EACCES: permission denied, writeFile C:\\Users\\Bob\\project.hepha')
      const diag = sanitizeError(err)
      expect(diag.category).toBe('STORAGE_IO')
      expect(diag.sanitizedMessage).not.toContain('Bob')
      expect(diag.actionableHint).toContain('write permissions')
    })

    it('falls back to safe generic runtime exception for arbitrary errors', () => {
      const diag = sanitizeError('Something completely random broke')
      expect(diag.category).toBe('RUNTIME_EXCEPTION')
      expect(diag.actionableHint).toContain('safely isolated the error')
    })
  })
})
