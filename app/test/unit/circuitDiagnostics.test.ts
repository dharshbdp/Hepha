import { describe, it, expect, beforeAll } from 'vitest'
import * as Blockly from 'blockly'
import { registerHardwareBlocks } from '../../src/core/blocks'
import { diagnoseCircuit } from '../../src/core/validation/circuitDiagnostics'

describe('Static Hardware & Pin Conflict Diagnostics (circuitDiagnostics)', () => {
  beforeAll(() => {
    registerHardwareBlocks()
  })

  it('validates a clean, conflict-free workspace', () => {
    const workspace = new Blockly.Workspace()
    const block1 = workspace.newBlock('pin_digital_write')
    block1.setFieldValue('13', 'PIN')

    const block2 = workspace.newBlock('pin_digital_write')
    block2.setFieldValue('12', 'PIN')

    const result = diagnoseCircuit(workspace as unknown as Blockly.WorkspaceSvg, 'arduino-uno')
    expect(result.isValid).toBe(true)
    expect(result.hasErrors).toBe(false)
    expect(result.conflicts.length).toBe(0)
  })

  it('detects Hardware Serial UART collision on Pin 0/1 for Arduino Uno', () => {
    const workspace = new Blockly.Workspace()
    // Use Pin 0 for digital output
    const writeBlock = workspace.newBlock('pin_digital_write')
    writeBlock.setFieldValue('0', 'PIN')

    // Also use Serial print
    const serialBlock = workspace.newBlock('serial_print')
    writeBlock.nextConnection?.connect(serialBlock.previousConnection)

    const result = diagnoseCircuit(workspace as unknown as Blockly.WorkspaceSvg, 'arduino_uno')
    expect(result.hasErrors).toBe(true)
    const uartConflict = result.conflicts.find((c) => c.id.includes('serial-conflict'))
    expect(uartConflict).toBeDefined()
    expect(uartConflict?.message).toContain('Serial transmission')
  })

  it('detects Non-PWM Pin used for analog PWM on Arduino Uno', () => {
    const workspace = new Blockly.Workspace()
    const pwmBlock = workspace.newBlock('pin_analog_write')
    pwmBlock.setFieldValue('8', 'PIN') // Pin 8 is not a PWM pin on Uno

    const result = diagnoseCircuit(workspace as unknown as Blockly.WorkspaceSvg, 'arduino_uno')
    expect(result.hasErrors).toBe(true)
    const pwmConflict = result.conflicts.find((c) => c.id.includes('pwm-mismatch'))
    expect(pwmConflict).toBeDefined()
    expect(pwmConflict?.message).toContain('lacks a hardware timer')
  })

  it('detects output pin contention when two blocks drive the same pin', () => {
    const workspace = new Blockly.Workspace()
    const block1 = workspace.newBlock('pin_digital_write')
    block1.setFieldValue('8', 'PIN')

    const block2 = workspace.newBlock('actuator_relay')
    block2.setFieldValue('8', 'PIN')

    const result = diagnoseCircuit(workspace as unknown as Blockly.WorkspaceSvg, 'arduino_uno')
    expect(result.hasWarnings || result.hasErrors).toBe(true)
    const contention = result.conflicts.find((c) => c.id.includes('pin-reuse'))
    expect(contention).toBeDefined()
  })
})
