/**
 * VirtualBoard — Virtual Microcontroller Hardware Model
 * Maintains board pin registers, validates GPIO operations against board profiles,
 * and emits state transitions for live inspection and attached components.
 */

import { ARDUINO_UNO_PROFILE } from '@hardware'
import type {
  BoardCapabilities,
  PinMode,
  DigitalValue,
  VirtualPin,
  SimulationDiagnostic,
  SimulationEventListener
} from './types'

export class VirtualBoard {
  public readonly capabilities: BoardCapabilities
  private pins: Map<string, VirtualPin> = new Map()
  private externalInputs: Map<string, { digital?: DigitalValue; analog?: number }> = new Map()
  private listeners: SimulationEventListener[] = []
  private diagnostics: SimulationDiagnostic[] = []

  constructor(boardId = 'arduino_uno') {
    // Default to Arduino Uno R3 capabilities
    const pwmPins = [...ARDUINO_UNO_PROFILE.pwmPins]
    const digitalPinIds = ARDUINO_UNO_PROFILE.digitalPins.map(([, val]) => val)
    const analogPinIds = ARDUINO_UNO_PROFILE.analogPins.map(([, val]) => val)

    this.capabilities = {
      id: boardId,
      name: ARDUINO_UNO_PROFILE.name,
      voltage: ARDUINO_UNO_PROFILE.voltage,
      digitalPins: digitalPinIds,
      analogPins: analogPinIds,
      pwmPins,
      adcResolutionBits: 10 // 0 - 1023
    }

    this.initializePins()
  }

  public subscribe(listener: SimulationEventListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyPinChange(pin: VirtualPin): void {
    for (const listener of this.listeners) {
      listener({ type: 'gpio_change', pin: pin.id, pinState: { ...pin } })
    }
  }

  private notifyDiagnostic(diagnostic: SimulationDiagnostic): void {
    this.diagnostics.push(diagnostic)
    for (const listener of this.listeners) {
      listener({ type: 'diagnostic', diagnostic })
    }
  }

  public initializePins(): void {
    this.pins.clear()
    this.externalInputs.clear()
    this.diagnostics = []

    // Initialize Digital Pins D0 - D13
    for (const id of this.capabilities.digitalPins) {
      const isPwm = this.capabilities.pwmPins.includes(id)
      this.pins.set(id, {
        id,
        name: `D${id}`,
        mode: 'INPUT',
        digitalValue: 0,
        analogValue: 0,
        pwmValue: 0,
        isPwmCapable: isPwm,
        isAnalogCapable: false,
        lastChangedUs: 0
      })
    }

    // Initialize Analog Pins A0 - A5
    for (const id of this.capabilities.analogPins) {
      this.pins.set(id, {
        id,
        name: id,
        mode: 'INPUT',
        digitalValue: 0,
        analogValue: 0,
        pwmValue: 0,
        isPwmCapable: false,
        isAnalogCapable: true,
        lastChangedUs: 0
      })
    }
  }

  public normalizePinId(rawPin: string | number): string {
    const s = String(rawPin).trim()
    if (s.startsWith('A') || s.startsWith('a')) {
      return s.toUpperCase()
    }
    // Remove leading 'D' if present (e.g. "D13" -> "13")
    if (s.startsWith('D') || s.startsWith('d')) {
      return s.slice(1)
    }
    return s
  }

  public getPin(rawPin: string | number): VirtualPin | undefined {
    const id = this.normalizePinId(rawPin)
    return this.pins.get(id)
  }

  public getAllPins(): VirtualPin[] {
    return Array.from(this.pins.values())
  }

  public setPinMode(rawPin: string | number, mode: PinMode, currentUs = 0): boolean {
    const id = this.normalizePinId(rawPin)
    const pin = this.pins.get(id)
    if (!pin) {
      this.notifyDiagnostic({
        severity: 'error',
        message: `Attempted to set mode '${mode}' on nonexistent pin '${rawPin}'`,
        pin: String(rawPin)
      })
      return false
    }

    pin.mode = mode
    pin.lastChangedUs = currentUs

    // If configured as INPUT_PULLUP, default digital value to 1 unless pulled low externally
    if (mode === 'INPUT_PULLUP') {
      const ext = this.externalInputs.get(id)
      pin.digitalValue = ext?.digital !== undefined ? ext.digital : 1
    } else if (mode === 'INPUT') {
      const ext = this.externalInputs.get(id)
      pin.digitalValue = ext?.digital !== undefined ? ext.digital : 0
    }

    this.notifyPinChange(pin)
    return true
  }

  public digitalWrite(
    rawPin: string | number,
    value: DigitalValue | number,
    currentUs = 0
  ): boolean {
    const id = this.normalizePinId(rawPin)
    const pin = this.pins.get(id)
    if (!pin) {
      this.notifyDiagnostic({
        severity: 'error',
        message: `digitalWrite: pin '${rawPin}' not found on board ${this.capabilities.name}`,
        pin: String(rawPin)
      })
      return false
    }

    if (pin.mode !== 'OUTPUT') {
      this.notifyDiagnostic({
        severity: 'warning',
        message: `digitalWrite called on pin ${pin.name} configured as ${pin.mode}. Auto-configuring to OUTPUT.`,
        pin: pin.id
      })
      pin.mode = 'OUTPUT'
    }

    const normalizedVal: DigitalValue = value ? 1 : 0
    pin.digitalValue = normalizedVal
    pin.pwmValue = normalizedVal ? 255 : 0
    pin.analogValue = normalizedVal ? 1023 : 0
    pin.lastChangedUs = currentUs

    this.notifyPinChange(pin)
    return true
  }

  public digitalRead(rawPin: string | number): DigitalValue {
    const id = this.normalizePinId(rawPin)
    const pin = this.pins.get(id)
    if (!pin) {
      this.notifyDiagnostic({
        severity: 'error',
        message: `digitalRead: pin '${rawPin}' not found on board ${this.capabilities.name}`,
        pin: String(rawPin)
      })
      return 0
    }

    // Check external component driver first
    const ext = this.externalInputs.get(id)
    if (ext?.digital !== undefined) {
      return ext.digital
    }

    if (pin.mode === 'INPUT_PULLUP') {
      return 1
    }

    return pin.digitalValue
  }

  public analogWrite(rawPin: string | number, value: number, currentUs = 0): boolean {
    const id = this.normalizePinId(rawPin)
    const pin = this.pins.get(id)
    if (!pin) {
      this.notifyDiagnostic({
        severity: 'error',
        message: `analogWrite: pin '${rawPin}' not found on board ${this.capabilities.name}`,
        pin: String(rawPin)
      })
      return false
    }

    if (!pin.isPwmCapable) {
      this.notifyDiagnostic({
        severity: 'warning',
        message: `analogWrite called on pin ${pin.name} which does not support PWM hardware timers on ${this.capabilities.name}. Simulating software threshold.`,
        pin: pin.id
      })
    }

    const clampedPwm = Math.max(0, Math.min(255, Math.round(value)))
    pin.mode = 'OUTPUT'
    pin.pwmValue = clampedPwm
    pin.digitalValue = clampedPwm >= 128 ? 1 : 0
    pin.analogValue = Math.round((clampedPwm / 255) * 1023)
    pin.lastChangedUs = currentUs

    this.notifyPinChange(pin)
    return true
  }

  public analogRead(rawPin: string | number): number {
    const id = this.normalizePinId(rawPin)
    const pin = this.pins.get(id)
    if (!pin) {
      this.notifyDiagnostic({
        severity: 'error',
        message: `analogRead: pin '${rawPin}' not found on board ${this.capabilities.name}`,
        pin: String(rawPin)
      })
      return 0
    }

    // Check external analog component input
    const ext = this.externalInputs.get(id)
    if (ext?.analog !== undefined) {
      return Math.max(0, Math.min(1023, Math.round(ext.analog)))
    }

    return pin.analogValue
  }

  /**
   * Sets external input provided by a connected interactive component
   * (e.g. push button, potentiometer, sensor).
   */
  public setExternalInput(
    rawPin: string | number,
    input: { digital?: DigitalValue; analog?: number },
    currentUs = 0
  ): void {
    const id = this.normalizePinId(rawPin)
    const pin = this.pins.get(id)
    if (!pin) return

    const existing = this.externalInputs.get(id) || {}
    if (input.digital !== undefined) existing.digital = input.digital
    if (input.analog !== undefined) existing.analog = input.analog
    this.externalInputs.set(id, existing)

    if (input.digital !== undefined) {
      pin.digitalValue = input.digital
    }
    if (input.analog !== undefined) {
      pin.analogValue = Math.max(0, Math.min(1023, Math.round(input.analog)))
    }
    pin.lastChangedUs = currentUs
    this.notifyPinChange(pin)
  }

  public reset(): void {
    this.initializePins()
  }

  public getDiagnostics(): readonly SimulationDiagnostic[] {
    return this.diagnostics
  }
}
