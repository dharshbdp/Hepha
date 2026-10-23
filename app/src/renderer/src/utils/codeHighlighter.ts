/**
 * Hepha Code Highlighter
 * Lightweight, zero-dependency, deterministic syntax highlighter for Arduino C++ and MicroPython.
 */

export type SupportedLanguage = 'cpp' | 'python'

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface Rule {
  type: string
  pattern: RegExp
}

const CPP_RULES: Rule[] = [
  // Multi-line comment
  { type: 'comment', pattern: /\/\*[\s\S]*?\*\//y },
  // Single-line comment
  { type: 'comment', pattern: /\/\/.*/y },
  // Preprocessor directives (#include <...>, #define, etc.)
  { type: 'preprocessor', pattern: /#\s*[a-zA-Z_]\w*(?:\s*<[^>\n]+>|\s*"[^"\n]+")?/y },
  // Strings & chars
  { type: 'string', pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y },
  // Hex, binary, floats, ints
  { type: 'number', pattern: /\b(?:0x[0-9a-fA-F]+|0b[01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/y },
  // Constants
  {
    type: 'constant',
    pattern:
      /\b(?:HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|LED_BUILTIN|true|false|NULL|nullptr|HEX|BIN|DEC|OCT)\b/y
  },
  // Types & Arduino Core Classes
  {
    type: 'type',
    pattern:
      /\b(?:void|bool|boolean|char|byte|int|short|long|float|double|unsigned|signed|size_t|int8_t|int16_t|int32_t|uint8_t|uint16_t|uint32_t|uint64_t|String|word|Servo|LiquidCrystal|LiquidCrystal_I2C|Adafruit_NeoPixel|DHT|Wire|SPI|SoftwareSerial|HardwareSerial)\b/y
  },
  // Language Keywords
  {
    type: 'keyword',
    pattern:
      /\b(?:if|else|for|while|do|switch|case|default|break|continue|return|goto|typedef|struct|class|enum|union|const|static|volatile|inline|virtual|override|public|private|protected|namespace|using|new|delete|sizeof)\b/y
  },
  // Arduino & Hardware Builtin Functions
  {
    type: 'builtin',
    pattern:
      /\b(?:setup|loop|pinMode|digitalWrite|digitalRead|analogWrite|analogRead|analogReference|delay|delayMicroseconds|millis|micros|pulseIn|pulseInLong|shiftIn|shiftOut|tone|noTone|random|randomSeed|map|constrain|min|max|abs|sq|sqrt|pow|sin|cos|tan|Serial|begin|print|println|write|read|available|flush|attach|detach)\b/y
  },
  // Function Call (identifier followed by '(')
  { type: 'function', pattern: /\b[a-zA-Z_]\w*(?=\s*\()/y },
  // Identifiers / Variables
  { type: 'variable', pattern: /\b[a-zA-Z_]\w*\b/y },
  // Operators
  { type: 'operator', pattern: /[+\-*/%=!<>|&^~?:;]/y },
  // Punctuation
  { type: 'punctuation', pattern: /[.,()[\]{}]/y },
  // Whitespace (preserved unstyled)
  { type: 'whitespace', pattern: /\s+/y },
  // Fallback single character
  { type: 'other', pattern: /./y }
]

const PYTHON_RULES: Rule[] = [
  // Multi-line docstrings
  { type: 'string', pattern: /"""[\s\S]*?"""|'''[\s\S]*?'''/y },
  // Single-line comment
  { type: 'comment', pattern: /#.*/y },
  // Decorator
  { type: 'preprocessor', pattern: /@\w+/y },
  // Strings
  { type: 'string', pattern: /(?:[fFrRbBuU]?(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'))/y },
  // Numbers
  {
    type: 'number',
    pattern: /\b(?:0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/y
  },
  // Constants
  { type: 'constant', pattern: /\b(?:True|False|None)\b/y },
  // Keywords
  {
    type: 'keyword',
    pattern:
      /\b(?:def|class|return|if|elif|else|for|while|break|continue|pass|import|from|as|try|except|finally|raise|with|lambda|yield|global|nonlocal|assert|del|in|is|and|or|not)\b/y
  },
  // Builtin Functions & Types
  {
    type: 'builtin',
    pattern:
      /\b(?:print|range|len|str|int|float|bool|list|dict|set|tuple|type|isinstance|enumerate|zip|map|filter|all|any|min|max|sum|abs|round|sorted|open|input|chr|ord|hex|bin|oct)\b/y
  },
  // MicroPython Hardware Modules & Classes
  {
    type: 'type',
    pattern:
      /\b(?:time|machine|Pin|ADC|PWM|UART|I2C|SPI|RTC|Timer|WDT|neopixel|dht|OUT|IN|PULL_UP|PULL_DOWN)\b/y
  },
  // MicroPython Hardware Methods
  {
    type: 'builtin',
    pattern:
      /\b(?:sleep|sleep_ms|sleep_us|ticks_ms|ticks_us|ticks_diff|time_pulse_us|value|duty_u16|read_u16|freq)\b/y
  },
  // Function Call (identifier followed by '(')
  { type: 'function', pattern: /\b[a-zA-Z_]\w*(?=\s*\()/y },
  // Identifiers / Variables
  { type: 'variable', pattern: /\b[a-zA-Z_]\w*\b/y },
  // Operators
  { type: 'operator', pattern: /[+\-*/%=!<>|&^~?:;]/y },
  // Punctuation
  { type: 'punctuation', pattern: /[.,()[\]{}]/y },
  // Whitespace (preserved unstyled)
  { type: 'whitespace', pattern: /\s+/y },
  // Fallback single character
  { type: 'other', pattern: /./y }
]

export function highlightCode(code: string, language: SupportedLanguage): string {
  if (!code) return ''

  const rules = language === 'cpp' ? CPP_RULES : PYTHON_RULES
  let pos = 0
  let html = ''

  while (pos < code.length) {
    let matched = false

    for (const rule of rules) {
      rule.pattern.lastIndex = pos
      const match = rule.pattern.exec(code)
      if (match && match.index === pos && match[0].length > 0) {
        const text = match[0]
        pos += text.length
        matched = true

        if (rule.type === 'whitespace' || rule.type === 'other') {
          html += escapeHtml(text)
        } else {
          html += `<span class="cf-tok-${rule.type}">${escapeHtml(text)}</span>`
        }
        break
      }
    }

    if (!matched) {
      html += escapeHtml(code[pos])
      pos++
    }
  }

  return html
}
