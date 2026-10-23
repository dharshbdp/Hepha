/**
 * Automated Test Suite — Virtual Simulation Engine
 * Section 11 Testing Requirements:
 * - Board initialization and capabilities
 * - GPIO input/output and PWM behaviour
 * - Virtual clock & timing
 * - Virtual serial output
 * - Component models (LED, Button, Potentiometer, Ultrasonic)
 * - IR instruction execution (variables, arithmetic, conditionals, loops)
 * - Diagnostics for invalid pins and unsupported operations
 * - Execution lifecycle (start, pause, resume, reset, stop, step)
 * - Demonstration scenarios (Blink, Button LED, Analog Potentiometer, Ultrasonic)
 * - Persistence backward compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  SimulationEngine,
  VirtualBoard,
  VirtualClock,
  VirtualSerial,
  VirtualComponentRegistry,
  DEMO_PROJECT_BLINK,
  DEMO_PROJECT_BUTTON,
  DEMO_PROJECT_ANALOG,
  DEMO_PROJECT_ULTRASONIC,
  type VirtualCircuitConfig
} from '../../src/simulator'
import type { HephaProject } from '../../src/shared/types'

describe('Simulation Engine Unit & Integration Tests', () => {
  describe('VirtualBoard & GPIO', () => {
    let board: VirtualBoard

    beforeEach(() => {
      board = new VirtualBoard('arduino_uno')
    })

    it('initializes Arduino Uno R3 pin capabilities correctly', () => {
      expect(board.capabilities.id).toBe('arduino_uno')
      expect(board.capabilities.voltage).toBe(5.0)
      expect(board.capabilities.adcResolutionBits).toBe(10)
      expect(board.capabilities.pwmPins).toEqual(['3', '5', '6', '9', '10', '11'])
      expect(board.capabilities.digitalPins.length).toBe(14) // D0 to D13
      expect(board.capabilities.analogPins.length).toBe(6) // A0 to A5
    })

    it('handles pinMode, digitalWrite, and digitalRead', () => {
      board.setPinMode('13', 'OUTPUT')
      const pin13 = board.getPin('13')
      expect(pin13?.mode).toBe('OUTPUT')
      expect(pin13?.digitalValue).toBe(0)

      board.digitalWrite('13', 1)
      expect(board.digitalRead('13')).toBe(1)
      expect(board.getPin('13')?.pwmValue).toBe(255)

      board.digitalWrite('13', 0)
      expect(board.digitalRead('13')).toBe(0)
      expect(board.getPin('13')?.pwmValue).toBe(0)
    })

    it('handles INPUT_PULLUP pin mode with default HIGH state', () => {
      board.setPinMode('2', 'INPUT_PULLUP')
      expect(board.digitalRead('2')).toBe(1)

      // External button press grounds the pin
      board.setExternalInput('2', { digital: 0 })
      expect(board.digitalRead('2')).toBe(0)

      // Release button
      board.setExternalInput('2', { digital: 1 })
      expect(board.digitalRead('2')).toBe(1)
    })

    it('handles PWM analogWrite on capable pins', () => {
      board.setPinMode('9', 'OUTPUT')
      expect(board.getPin('9')?.isPwmCapable).toBe(true)

      board.analogWrite('9', 128)
      expect(board.getPin('9')?.pwmValue).toBe(128)
      expect(board.getPin('9')?.analogValue).toBe(Math.round((128 / 255) * 1023))

      // Clamping values outside 0-255
      board.analogWrite('9', 300)
      expect(board.getPin('9')?.pwmValue).toBe(255)

      board.analogWrite('9', -50)
      expect(board.getPin('9')?.pwmValue).toBe(0)
    })

    it('handles analogRead on analog pins A0-A5', () => {
      board.setExternalInput('A0', { analog: 768 })
      expect(board.analogRead('A0')).toBe(768)

      // Clamps analog readings to 10-bit range (0 - 1023)
      board.setExternalInput('A1', { analog: 1200 })
      expect(board.analogRead('A1')).toBe(1023)
    })

    it('records diagnostics for invalid pin operations', () => {
      board.digitalWrite('99', 1)
      const diags = board.getDiagnostics()
      expect(diags.length).toBeGreaterThan(0)
      expect(diags[0].severity).toBe('error')
      expect(diags[0].message).toContain('not found')
    })
  })

  describe('VirtualClock', () => {
    let clock: VirtualClock

    beforeEach(() => {
      clock = new VirtualClock(1.0)
    })

    it('tracks elapsed virtual microseconds and milliseconds', () => {
      expect(clock.getElapsedMicros()).toBe(0)
      expect(clock.getElapsedMillis()).toBe(0)

      clock.advanceMillis(1500)
      expect(clock.getElapsedMillis()).toBe(1500)
      expect(clock.getElapsedMicros()).toBe(1500000)

      clock.advanceMicros(500)
      expect(clock.getElapsedMicros()).toBe(1500500)
    })

    it('formats virtual time accurately', () => {
      clock.advanceMillis(3661125) // 1 hour, 1 minute, 1 second, 125ms
      expect(clock.formatTime()).toBe('01:01:01.125')
    })

    it('handles speed multiplier scaling and reset', () => {
      clock.setSpeed(2.0)
      expect(clock.getSpeed()).toBe(2.0)

      clock.reset()
      expect(clock.getElapsedMicros()).toBe(0)
    })
  })

  describe('VirtualSerial', () => {
    let serial: VirtualSerial

    beforeEach(() => {
      serial = new VirtualSerial(50)
    })

    it('accumulates and flushes serial entries with virtual timestamps', () => {
      serial.print('Hello', 100, false)
      serial.print(' World', 120, true)

      const entries = serial.getEntries()
      expect(entries.length).toBe(1)
      expect(entries[0].text).toBe('Hello World')
      expect(entries[0].virtualTimeMs).toBe(120)
    })

    it('clears serial entries on reset', () => {
      serial.println('Test 1', 10)
      serial.println('Test 2', 20)
      expect(serial.getEntries().length).toBe(2)

      serial.clear()
      expect(serial.getEntries().length).toBe(0)
    })
  })

  describe('Virtual Components', () => {
    let board: VirtualBoard
    let components: VirtualComponentRegistry

    beforeEach(() => {
      board = new VirtualBoard('arduino_uno')
      components = new VirtualComponentRegistry(board)
    })

    it('updates virtual LED state based on pin output and PWM brightness', () => {
      components.addComponent({
        id: 'led_1',
        type: 'led',
        name: 'Test LED',
        pin: '13'
      })

      board.digitalWrite('13', 0)
      expect(components.getLedState('led_1')).toEqual({ isOn: false, brightness: 0, pin: '13' })

      board.digitalWrite('13', 1)
      expect(components.getLedState('led_1')).toEqual({ isOn: true, brightness: 100, pin: '13' })

      // PWM LED
      components.addComponent({
        id: 'led_pwm',
        type: 'led',
        name: 'PWM LED',
        pin: '9'
      })
      board.analogWrite('9', 128)
      const pwmState = components.getLedState('led_pwm')
      expect(pwmState.isOn).toBe(true)
      expect(pwmState.brightness).toBe(50) // 128/255 ~ 50%
    })

    it('interacts with virtual Push Button and feeds into digitalRead', () => {
      components.addComponent({
        id: 'btn_1',
        type: 'button',
        name: 'Push Button',
        pin: '2',
        activeLow: true
      })

      // Unpressed (activeLow pull-up -> 1)
      expect(components.isButtonPressed('btn_1')).toBe(false)
      expect(board.digitalRead('2')).toBe(1)

      // Pressed -> 0
      components.setButtonPressed('btn_1', true)
      expect(components.isButtonPressed('btn_1')).toBe(true)
      expect(board.digitalRead('2')).toBe(0)

      // Released -> 1
      components.setButtonPressed('btn_1', false)
      expect(board.digitalRead('2')).toBe(1)
    })

    it('updates Potentiometer value and provides voltage calculation', () => {
      components.addComponent({
        id: 'pot_1',
        type: 'potentiometer',
        name: 'Potentiometer',
        pin: 'A0',
        currentValue: 512
      })

      expect(board.analogRead('A0')).toBe(512)

      components.setPotentiometerValue('pot_1', 1023)
      expect(components.getPotentiometerValue('pot_1')).toBe(1023)
      expect(board.analogRead('A0')).toBe(1023)
    })

    it('simulates Ultrasonic Distance Sensor readings', () => {
      components.addComponent({
        id: 'us_1',
        type: 'ultrasonic',
        name: 'HC-SR04',
        trigPin: '9',
        echoPin: '10',
        distanceCm: 42
      })

      expect(components.getUltrasonicDistance('us_1')).toBe(42)
      expect(components.getUltrasonicDistanceByPins('9', '10')).toBe(42)

      components.setUltrasonicDistance('us_1', 18)
      expect(components.getUltrasonicDistanceByPins('9', '10')).toBe(18)
    })
  })

  describe('Instruction IR & Expression Evaluation', () => {
    let engine: SimulationEngine

    beforeEach(() => {
      engine = new SimulationEngine('arduino_uno')
    })

    it('evaluates arithmetic and binary comparison expressions', () => {
      const num10 = { type: 'literal_number' as const, value: 10 }
      const num5 = { type: 'literal_number' as const, value: 5 }

      expect(
        engine.evaluateExpr({
          type: 'binary_op',
          op: 'ADD',
          left: num10,
          right: num5
        })
      ).toBe(15)

      expect(
        engine.evaluateExpr({
          type: 'binary_op',
          op: 'MULTIPLY',
          left: num10,
          right: num5
        })
      ).toBe(50)

      expect(
        engine.evaluateExpr({
          type: 'binary_op',
          op: 'GT',
          left: num10,
          right: num5
        })
      ).toBe(true)

      expect(
        engine.evaluateExpr({
          type: 'binary_op',
          op: 'LT',
          left: num10,
          right: num5
        })
      ).toBe(false)
    })

    it('manages variable assignments and lookups', () => {
      engine.loadProgram({
        blocks: {
          blocks: [
            {
              type: 'variables_set',
              fields: { VAR: 'counter' },
              inputs: {
                VALUE: {
                  shadow: { type: 'math_number', fields: { NUM: 42 } }
                }
              }
            }
          ]
        }
      })

      engine.step()
      expect(engine.getVariable('counter')).toBe(42)
    })
  })

  describe('Demonstration Projects Integration Tests', () => {
    it('executes Example A (LED Blink) deterministically', () => {
      const engine = new SimulationEngine('arduino_uno')
      engine.loadCircuitConfig(DEMO_PROJECT_BLINK.circuitConfig)
      engine.loadProgram(DEMO_PROJECT_BLINK.workspace)

      expect(engine.board.digitalRead('13')).toBe(0)

      // Step 1: Digital Write Pin 13 HIGH
      engine.step()
      expect(engine.board.digitalRead('13')).toBe(1)
      expect(engine.components.getLedState('led_13').isOn).toBe(true)

      // Step 2: Delay 500ms
      engine.step()
      expect(engine.clock.getElapsedMillis()).toBe(500)

      // Step 3: Digital Write Pin 13 LOW
      engine.step()
      expect(engine.board.digitalRead('13')).toBe(0)
      expect(engine.components.getLedState('led_13').isOn).toBe(false)

      // Step 4: Delay 500ms
      engine.step()
      expect(engine.clock.getElapsedMillis()).toBe(1000)
    })

    it('executes Example B (Button-Controlled LED) based on user interaction', () => {
      const engine = new SimulationEngine('arduino_uno')
      engine.loadCircuitConfig(DEMO_PROJECT_BUTTON.circuitConfig)
      engine.loadProgram(DEMO_PROJECT_BUTTON.workspace)

      // Initially button is unpressed (pin 2 is HIGH via pullup)
      engine.step() // evaluates if (read(2) == 0) -> false -> else (pin 13 LOW)
      expect(engine.board.digitalRead('13')).toBe(0)
      expect(engine.components.getLedState('led_13').isOn).toBe(false)

      // User presses button (pin 2 goes LOW = 0)
      engine.components.setButtonPressed('btn_2', true)
      engine.step() // delay step
      engine.step() // next loop: evaluates if (read(2) == 0) -> true -> DO (pin 13 HIGH)

      expect(engine.board.digitalRead('13')).toBe(1)
      expect(engine.components.getLedState('led_13').isOn).toBe(true)
      expect(engine.serial.getEntries().some((e) => e.text.includes('Button Pressed'))).toBe(true)
    })

    it('executes Example C (Analog Potentiometer & PWM)', () => {
      const engine = new SimulationEngine('arduino_uno')
      engine.loadCircuitConfig(DEMO_PROJECT_ANALOG.circuitConfig)
      engine.loadProgram(DEMO_PROJECT_ANALOG.workspace)

      // Set potentiometer to 1020
      engine.components.setPotentiometerValue('pot_a0', 1020)

      // Step 1: variables_set sensorValue = analogRead(A0)
      engine.step()
      expect(engine.getVariable('sensorValue')).toBe(1020)

      // Step 2: analog_write Pin 9 = sensorValue / 4 = 255
      engine.step()
      expect(engine.board.getPin('9')?.pwmValue).toBe(255)
      expect(engine.components.getLedState('led_pwm_9').brightness).toBe(100)

      // Step 3: serial print sensorValue
      engine.step()
      const entries = engine.serial.getEntries()
      expect(entries.length).toBeGreaterThan(0)
      expect(entries[entries.length - 1].text).toContain('1020')
    })

    it('executes Example D (Ultrasonic Sensor Proximity Alert)', () => {
      const engine = new SimulationEngine('arduino_uno')
      engine.loadCircuitConfig(DEMO_PROJECT_ULTRASONIC.circuitConfig)
      engine.loadProgram(DEMO_PROJECT_ULTRASONIC.workspace)

      // Set distance to 50cm (above 30cm threshold)
      engine.components.setUltrasonicDistance('hc_sr04', 50)

      engine.step() // set distance var = 50
      expect(engine.getVariable('distance')).toBe(50)

      engine.step() // if (distance < 30) -> false -> else alert_off
      expect(engine.board.digitalRead('13')).toBe(0)
      expect(engine.components.getLedState('led_alert').isOn).toBe(false)

      // Move object closer: 20cm (below 30cm threshold)
      engine.components.setUltrasonicDistance('hc_sr04', 20)
      engine.step() // delay step
      engine.step() // next loop: set distance var = 20
      expect(engine.getVariable('distance')).toBe(20)

      engine.step() // if (distance < 30) -> true -> DO alert_on & serial print
      expect(engine.board.digitalRead('13')).toBe(1)
      expect(engine.components.getLedState('led_alert').isOn).toBe(true)
      expect(engine.serial.getEntries().some((e) => e.text.includes('WARNING'))).toBe(true)
    })
  })

  describe('Lifecycle Controls & Safety', () => {
    it('supports pause, resume, reset, and stop without leaking state', () => {
      const engine = new SimulationEngine('arduino_uno')
      engine.loadProgram(DEMO_PROJECT_BLINK.workspace)

      expect(engine.getStatus()).toBe('idle')

      engine.start()
      expect(engine.getStatus()).toBe('running')

      engine.pause()
      expect(engine.getStatus()).toBe('paused')

      engine.resume()
      expect(engine.getStatus()).toBe('running')

      engine.stop()
      expect(engine.getStatus()).toBe('stopped')

      engine.reset()
      expect(engine.getStatus()).toBe('idle')
      expect(engine.clock.getElapsedMillis()).toBe(0)
      expect(engine.board.digitalRead('13')).toBe(0)
    })

    it('survives while loops with safety iteration limits', () => {
      const engine = new SimulationEngine('arduino_uno')
      engine.loadProgram({
        blocks: {
          blocks: [
            {
              type: 'controls_whileUntil',
              fields: { MODE: 'WHILE' },
              inputs: {
                BOOL: {
                  shadow: { type: 'logic_boolean', fields: { BOOL: 'TRUE' } }
                }
              }
            }
          ]
        }
      })

      // Must not hang or throw unhandled error
      expect(() => engine.step()).not.toThrow()
    })
  })

  describe('Persistence Backward Compatibility', () => {
    it('handles projects without simulation configuration gracefully', () => {
      const legacyProject: HephaProject = {
        formatVersion: '1.0',
        name: 'Legacy Project',
        boardId: 'arduino:avr:uno',
        baudRate: 115200,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        workspace: { blocks: { blocks: [] } }
      }

      expect(legacyProject.simulation).toBeUndefined()

      // Loading legacy project into simulation engine creates default board
      const engine = new SimulationEngine(legacyProject.boardId)
      expect(engine.board.capabilities.digitalPins.length).toBeGreaterThan(0)
      expect(engine.components.getAllComponents().length).toBe(0)
    })

    it('persists and restores simulation circuit config cleanly', () => {
      const modernProject: HephaProject = {
        formatVersion: '1.0',
        name: 'Simulated Blink',
        boardId: 'arduino_uno',
        baudRate: 115200,
        createdAt: '2026-10-23T00:00:00.000Z',
        updatedAt: '2026-10-23T00:00:00.000Z',
        workspace: DEMO_PROJECT_BLINK.workspace,
        simulation: DEMO_PROJECT_BLINK.circuitConfig
      }

      const engine = new SimulationEngine(modernProject.boardId)
      if (modernProject.simulation) {
        engine.loadCircuitConfig(modernProject.simulation as unknown as VirtualCircuitConfig)
      }
      expect(engine.components.getAllComponents().length).toBe(1)
      expect(engine.components.getAllComponents()[0].id).toBe('led_13')
    })
  })
})
