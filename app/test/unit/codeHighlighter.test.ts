import { describe, it, expect } from 'vitest'
import { highlightCode, escapeHtml } from '../../src/renderer/src/utils/codeHighlighter'

describe('Code Syntax Highlighter (codeHighlighter)', () => {
  describe('HTML escaping', () => {
    it('escapes &, <, >, ", and single quotes properly', () => {
      expect(escapeHtml('1 < 2 && 3 > 2 "test" \'val\'')).toBe(
        '1 &lt; 2 &amp;&amp; 3 &gt; 2 &quot;test&quot; &#039;val&#039;'
      )
    })
  })

  describe('Arduino C++ Syntax Highlighting', () => {
    it('highlights preprocessor include directives and comments', () => {
      const code = `// Header comment\n#include <Servo.h>\n/* multi\nline */`
      const html = highlightCode(code, 'cpp')

      expect(html).toContain('<span class="cf-tok-comment">// Header comment</span>')
      expect(html).toContain('<span class="cf-tok-preprocessor">#include &lt;Servo.h&gt;</span>')
      expect(html).toContain('<span class="cf-tok-comment">/* multi\nline */</span>')
    })

    it('highlights C++ keywords, types, and numbers', () => {
      const code = 'void setup() {\n  int pin = 13;\n  if (pin > 10) return;\n}'
      const html = highlightCode(code, 'cpp')

      expect(html).toContain('<span class="cf-tok-type">void</span>')
      expect(html).toContain('<span class="cf-tok-builtin">setup</span>')
      expect(html).toContain('<span class="cf-tok-type">int</span>')
      expect(html).toContain('<span class="cf-tok-number">13</span>')
      expect(html).toContain('<span class="cf-tok-keyword">if</span>')
      expect(html).toContain('<span class="cf-tok-keyword">return</span>')
    })

    it('highlights Arduino hardware builtins and constants', () => {
      const code = 'pinMode(13, OUTPUT);\ndigitalWrite(13, HIGH);\nSerial.println("Hello");'
      const html = highlightCode(code, 'cpp')

      expect(html).toContain('<span class="cf-tok-builtin">pinMode</span>')
      expect(html).toContain('<span class="cf-tok-constant">OUTPUT</span>')
      expect(html).toContain('<span class="cf-tok-builtin">digitalWrite</span>')
      expect(html).toContain('<span class="cf-tok-constant">HIGH</span>')
      expect(html).toContain('<span class="cf-tok-builtin">Serial</span>')
      expect(html).toContain('<span class="cf-tok-builtin">println</span>')
      expect(html).toContain('<span class="cf-tok-string">&quot;Hello&quot;</span>')
    })
  })

  describe('MicroPython Syntax Highlighting', () => {
    it('highlights Python comments, imports, and keywords', () => {
      const code = '# Python comment\nimport time\nfrom machine import Pin, ADC\n'
      const html = highlightCode(code, 'python')

      expect(html).toContain('<span class="cf-tok-comment"># Python comment</span>')
      expect(html).toContain('<span class="cf-tok-keyword">import</span>')
      expect(html).toContain('<span class="cf-tok-type">time</span>')
      expect(html).toContain('<span class="cf-tok-keyword">from</span>')
      expect(html).toContain('<span class="cf-tok-type">machine</span>')
      expect(html).toContain('<span class="cf-tok-type">Pin</span>')
      expect(html).toContain('<span class="cf-tok-type">ADC</span>')
    })

    it('highlights Python control flow, constants, and functions', () => {
      const code = 'def loop():\n  while True:\n    val = None\n    print("status", 42)'
      const html = highlightCode(code, 'python')

      expect(html).toContain('<span class="cf-tok-keyword">def</span>')
      expect(html).toContain('<span class="cf-tok-function">loop</span>')
      expect(html).toContain('<span class="cf-tok-keyword">while</span>')
      expect(html).toContain('<span class="cf-tok-constant">True</span>')
      expect(html).toContain('<span class="cf-tok-constant">None</span>')
      expect(html).toContain('<span class="cf-tok-builtin">print</span>')
      expect(html).toContain('<span class="cf-tok-string">&quot;status&quot;</span>')
      expect(html).toContain('<span class="cf-tok-number">42</span>')
    })
  })
})
