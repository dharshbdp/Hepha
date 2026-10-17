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

  it('generates serial print as standard Python print()', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('serial_print')
    block.setFieldValue('TRUE', 'NEWLINE')
    const textBlock = workspace.newBlock('text')
    textBlock.setFieldValue('Hepha MicroPython Node', 'TEXT')
    block.getInput('CONTENT')?.connection?.connect(textBlock.outputConnection)

    const code = micropythonGenerator.workspaceToCode(workspace)
    expect(code).toContain('print("Hepha MicroPython Node")')
  })
})
