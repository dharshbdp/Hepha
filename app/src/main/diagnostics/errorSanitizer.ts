/**
 * Hepha Privacy-Preserving Crash Diagnostics & Error Sanitizer
 * Strips personal paths, usernames, API keys, and sensitive tokens from error traces
 * while categorizing embedded hardware errors with actionable user remedies.
 */

export interface SanitizedDiagnostic {
  timestamp: string
  category:
    'HARDWARE_PORT' | 'COMPILER_TOOLCHAIN' | 'AI_SERVICE' | 'STORAGE_IO' | 'RUNTIME_EXCEPTION'
  sanitizedMessage: string
  actionableHint: string
  sanitizedStack?: string
}

/**
 * Sanitizes any raw string or error stack to remove secrets and personal data.
 */
export function sanitizeDiagnosticsText(text: string): string {
  if (!text) return ''

  return (
    text
      // 1. Scrub Google Gemini API keys (AIzaSy...)
      .replace(/AIzaSy[A-Za-z0-9_-]{20,}/g, '[REDACTED_GEMINI_KEY]')
      // 2. Scrub OpenAI / standard secret tokens
      .replace(/sk-[A-Za-z0-9]{20,}/g, '[REDACTED_API_TOKEN]')
      .replace(/(bearer|token|apikey|key)[:=\s]+(['"])?[A-Za-z0-9_\-.]{16,}\2/gi, '$1=[REDACTED]')
      // 3. Scrub Windows User Home directories (e.g. C:\Users\JohnDoe\... -> ~\...)
      .replace(/[A-Za-z]:\\Users\\[^\\]+/gi, '~')
      // 4. Scrub Unix/macOS User Home directories (/Users/johndoe/... or /home/johndoe/... -> ~)
      .replace(/\/(?:Users|home)\/[^/\s]+/gi, '~')
      // 5. Scrub query parameters in URLs containing tokens or keys
      .replace(/([?&](?:key|token|auth|secret)=)[^&\s]+/gi, '$1[REDACTED]')
  )
}

/**
 * Categorizes an error and provides actionable, beginner-friendly recovery instructions.
 */
export function sanitizeError(err: unknown): SanitizedDiagnostic {
  const timestamp = new Date().toISOString()
  const rawMessage = err instanceof Error ? err.message : String(err)
  const rawStack = err instanceof Error ? err.stack : undefined

  const sanitizedMessage = sanitizeDiagnosticsText(rawMessage)
  const sanitizedStack = rawStack ? sanitizeDiagnosticsText(rawStack) : undefined

  // Categorize & determine remediation hint
  // 1. Missing compiler or missing platform core
  if (
    /arduino-cli|executable not found|platform ['"]?.*['"]? not installed|unknown fqbn|platform .* not installed/i.test(
      rawMessage
    )
  ) {
    const isCoreMissing = /platform|fqbn/i.test(rawMessage)
    return {
      timestamp,
      category: 'COMPILER_TOOLCHAIN',
      sanitizedMessage,
      actionableHint: isCoreMissing
        ? 'The board core (AVR, ESP32, or RP2040) is missing. Open Toolchain Management in Hepha and install the required core.'
        : 'The embedded arduino-cli compiler was not found. Re-run toolchain installation in Hepha or ensure arduino-cli is accessible.',
      sanitizedStack
    }
  }

  // 2. Serial port hardware collisions
  if (
    /(?:access is denied|permission denied|busy|resource locked|cannot open).*(?:com\d+|tty|serial|port)/i.test(
      rawMessage
    ) ||
    /(?:com\d+|tty|serial port).*(?:access is denied|busy|locked|open)/i.test(rawMessage)
  ) {
    return {
      timestamp,
      category: 'HARDWARE_PORT',
      sanitizedMessage,
      actionableHint:
        'The serial COM port is locked by another program. Close any other Arduino IDE, PuTTY, or terminal instances before connecting or flashing.',
      sanitizedStack
    }
  }

  // 3. Project file storage / file system I/O
  if (/enoent|eacces|file system|readfile|writefile/i.test(rawMessage)) {
    return {
      timestamp,
      category: 'STORAGE_IO',
      sanitizedMessage,
      actionableHint:
        'Project file storage encountered an I/O issue. Verify write permissions for the destination directory.',
      sanitizedStack
    }
  }

  // 4. AI Copilot / LLM service issues
  if (/gemini|ai copilot|api key|quota/i.test(rawMessage)) {
    return {
      timestamp,
      category: 'AI_SERVICE',
      sanitizedMessage,
      actionableHint:
        'AI Copilot service encountered an issue. Check your API key in settings or verify your network connection. Offline deterministic features remain fully functional.',
      sanitizedStack
    }
  }

  return {
    timestamp,
    category: 'RUNTIME_EXCEPTION',
    sanitizedMessage,
    actionableHint:
      'An unexpected runtime condition occurred. Hepha safely isolated the error to protect active canvas state.',
    sanitizedStack
  }
}
