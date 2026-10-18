import { describe, it, expect, beforeAll } from 'vitest'
import * as Blockly from 'blockly'
import { registerHardwareBlocks } from '../../src/core/blocks'
import { micropythonGenerator } from '../../src/core/compiler'

describe('MicroPython Code Generation (micropythonGenerator)', () => {
  beforeAll(() => {
    registerHardwareBlocks()
  })

  it('generates MicroPython header scaffolding and import statements', () => {
    const workspace = new Blockly.Workspace()
    const code = micropythonGenerator.workspaceToCode(workspace)

    expect(code).toContain('# Hepha — Generated MicroPython')
    expect(code).toContain('import time')
    expect(code).toContain('from machine import Pin')
  })

  it('generates digital write output with MicroPython Pin API', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('pin_digital_write')
    block.setFieldValue('2', 'PIN')
    block.setFieldValue('HIGH', 'STATE')

    const code = micropythonGenerator.workspaceToCode(workspace)
    expect(code).toContain('pin_2 = Pin(2, Pin.OUT)')
    expect(code).toContain('pin_2.value(1)')
  })

  it('generates analog PWM write using 16-bit duty cycle scale', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('pin_analog_write')
    block.setFieldValue('4', 'PIN')
    const numBlock = workspace.newBlock('math_number')
    numBlock.setFieldValue('128', 'NUM')
    block.getInput('VALUE')?.connection?.connect(numBlock.outputConnection)

    const code = micropythonGenerator.workspaceToCode(workspace)
    expect(code).toContain('from machine import Pin, ADC, PWM')
    expect(code).toContain('pwm_4 = PWM(Pin(4))')
    expect(code).toContain('pwm_4.duty_u16(int(min(max(128, 0), 255) * 257))')
  })

  it('generates delay statements in milliseconds', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('time_delay')
    const numBlock = workspace.newBlock('math_number')
    numBlock.setFieldValue('250', 'NUM')
    block.getInput('DELAY_MS')?.connection?.connect(numBlock.outputConnection)

    const code = micropythonGenerator.workspaceToCode(workspace)
    expect(code).toContain('time.sleep_ms(int(250))')
  })

  it('generates serial print as standard Python print() with and without newline', () => {
    const workspace = new Blockly.Workspace()
    const block1 = workspace.newBlock('serial_print')
    block1.setFieldValue('TRUE', 'NEWLINE')
    const text1 = workspace.newBlock('text')
    text1.setFieldValue('With NL', 'TEXT')
    block1.getInput('CONTENT')?.connection?.connect(text1.outputConnection)

    const block2 = workspace.newBlock('serial_print')
    block2.setFieldValue('FALSE', 'NEWLINE')
    const text2 = workspace.newBlock('text')
    text2.setFieldValue('No NL', 'TEXT')
    block2.getInput('CONTENT')?.connection?.connect(text2.outputConnection)

    const code = micropythonGenerator.workspaceToCode(workspace)
    expect(code).toContain('print("With NL")')
    expect(code).toContain('print("No NL", end="")')
  })

  it('generates DHT11/DHT22 humidity and temperature metrics in MicroPython', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('sensor_dht')
    block.setFieldValue('4', 'PIN')
    block.setFieldValue('DHT22', 'MODEL')
    block.setFieldValue('HUMIDITY', 'METRIC')

    const code = micropythonGenerator.workspaceToCode(workspace)
    expect(code).toContain('import dht')
    expect(code).toContain('dht_4 = dht.DHT22(Pin(4))')
    expect(code).toContain('get_dht_value(dht_4, "hum")')
  })

  it('generates LDR light sensor percent and raw modes in MicroPython', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('sensor_light_ldr')
    block.setFieldValue('A0', 'PIN')
    block.setFieldValue('PERCENT', 'MODE')

    const code = micropythonGenerator.workspaceToCode(workspace)
    expect(code).toContain('ldr_adc_0 = ADC(Pin(0))')
    expect(code).toContain('(ldr_adc_0.read_u16() / 65535.0) * 100')
  })

  it('safely comments raw_cpp_code blocks in MicroPython', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('raw_cpp_code')
    block.setFieldValue('volatile uint8_t *reg = &PORTB;', 'CODE')

    const code = micropythonGenerator.workspaceToCode(workspace)
    expect(code).toContain('# [Raw C++]: volatile uint8_t *reg = &PORTB;')
  })
})
