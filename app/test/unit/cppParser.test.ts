import { describe, it, expect } from 'vitest'
import { parseCppToBlocks } from '../../src/core/parser/cppParser'

interface ASTBlockNode {
  type?: string
  fields?: Record<string, unknown>
  inputs?: Record<string, unknown>
  next?: { block?: ASTBlockNode }
}

function getBlockChain(root: ASTBlockNode | null | undefined): ASTBlockNode[] {
  const chain: ASTBlockNode[] = []
  let curr = root
  while (curr) {
    chain.push(curr)
    curr = curr.next?.block
  }
  return chain
}

describe('C++ to Blockly AST Parser (cppParser)', () => {
  it('parses standard Arduino digital and analog writes', () => {
    const code = `
void setup() {
  pinMode(13, OUTPUT);
}
void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}
`
    const result = parseCppToBlocks(code)
    expect(result.success).toBe(true)
    const blocks = getBlockChain(result.blocks[0])
    expect(blocks.length).toBe(5)
    expect(blocks[0].type).toBe('pin_set_mode')
    expect(blocks[0].fields?.PIN).toBe('13')
    expect(blocks[0].fields?.MODE).toBe('OUTPUT')
    expect(blocks[1].type).toBe('pin_digital_write')
    expect(blocks[1].fields?.PIN).toBe('13')
    expect(blocks[1].fields?.STATE).toBe('HIGH')
    expect(blocks[2].type).toBe('time_delay')
    expect(blocks[3].type).toBe('pin_digital_write')
    expect(blocks[3].fields?.STATE).toBe('LOW')
    expect(blocks[4].type).toBe('time_delay')
  })

  it('parses Serial.print and Serial.println strings and values', () => {
    const code = `
void loop() {
  Serial.print("Current Status: ");
  Serial.println(42);
}
`
    const result = parseCppToBlocks(code)
    expect(result.success).toBe(true)
    const blocks = getBlockChain(result.blocks[0])
    expect(blocks.length).toBe(2)
    expect(blocks[0].type).toBe('serial_print')
    expect(blocks[0].fields?.NEWLINE).toBe(false)
    expect(blocks[1].type).toBe('serial_print')
    expect(blocks[1].fields?.NEWLINE).toBe(true)
  })

  it('filters out auto-generated hardware attachment boilerplate and parses servo', () => {
    const code = `
void setup() {
  Serial.begin(115200);
  servo.attach(9);
  dht.begin();
  strip.begin();
}
void loop() {
  servo.write(180);
}
`
    const result = parseCppToBlocks(code)
    expect(result.success).toBe(true)
    const blocks = getBlockChain(result.blocks[0])
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('actuator_servo')
  })

  it('wraps unsupported or custom C++ statements in raw_cpp_code blocks without loss', () => {
    const code = `
void loop() {
  digitalWrite(13, HIGH);
  custom_filter_algorithm(&sensor_buffer, 0x3F);
  PORTB |= (1 << 5);
}
`
    const result = parseCppToBlocks(code)
    expect(result.success).toBe(true)
    const blocks = getBlockChain(result.blocks[0])
    expect(blocks.length).toBe(3)
    expect(blocks[0].type).toBe('pin_digital_write')
    expect(blocks[1].type).toBe('raw_cpp_code')
    expect(blocks[1].fields?.CODE).toContain('custom_filter_algorithm')
    expect(blocks[2].type).toBe('raw_cpp_code')
    expect(blocks[2].fields?.CODE).toContain('PORTB')
  })
})
