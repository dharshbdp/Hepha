/**
 * Virtual Components — Stateful Virtual Hardware Peripheral Models
 * Models LEDs, Push Buttons, Potentiometers, Digital Sensors, Analog Sensors,
 * and Ultrasonic Distance Sensors connected to the VirtualBoard.
 */

import type {
  VirtualComponentConfig,
  VirtualLedConfig,
  VirtualButtonConfig,
  VirtualPotentiometerConfig,
  VirtualDigitalSensorConfig,
  VirtualAnalogSensorConfig,
  VirtualUltrasonicConfig,
  DigitalValue
} from './types'
import type { VirtualBoard } from './virtualBoard'

export interface ComponentStateUpdate {
  componentId: string
  state: Record<string, unknown>
}

export type ComponentUpdateListener = (update: ComponentStateUpdate) => void

export class VirtualComponentRegistry {
  private components: Map<string, VirtualComponentConfig> = new Map()
  private board: VirtualBoard
  private listeners: ComponentUpdateListener[] = []

  // Component-specific runtime states
  private buttonStates: Map<string, boolean> = new Map() // true = pressed
  private potValues: Map<string, number> = new Map() // 0 - 1023
  private digitalSensorStates: Map<string, boolean> = new Map()
  private analogSensorValues: Map<string, number> = new Map()
  private ultrasonicDistances: Map<string, number> = new Map() // in cm

  constructor(board: VirtualBoard) {
    this.board = board
  }

  public subscribe(listener: ComponentUpdateListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify(componentId: string, state: Record<string, unknown>): void {
    for (const listener of this.listeners) {
      listener({ componentId, state })
    }
  }

  public addComponent(config: VirtualComponentConfig): void {
    this.components.set(config.id, { ...config })
    this.initializeComponentState(config)
  }

  public removeComponent(componentId: string): void {
    this.components.delete(componentId)
    this.buttonStates.delete(componentId)
    this.potValues.delete(componentId)
    this.digitalSensorStates.delete(componentId)
    this.analogSensorValues.delete(componentId)
    this.ultrasonicDistances.delete(componentId)
  }

  public getComponent(componentId: string): VirtualComponentConfig | undefined {
    return this.components.get(componentId)
  }

  public getAllComponents(): VirtualComponentConfig[] {
    return Array.from(this.components.values())
  }

  public clear(): void {
    this.components.clear()
    this.buttonStates.clear()
    this.potValues.clear()
    this.digitalSensorStates.clear()
    this.analogSensorValues.clear()
    this.ultrasonicDistances.clear()
  }

  private initializeComponentState(config: VirtualComponentConfig): void {
    switch (config.type) {
      case 'led':
        // LED state is driven by pin output
        break

      case 'button': {
        const btn = config as VirtualButtonConfig
        this.buttonStates.set(btn.id, false) // unpressed
        this.applyButtonState(btn, false)
        break
      }

      case 'potentiometer': {
        const pot = config as VirtualPotentiometerConfig
        const val = pot.currentValue !== undefined ? pot.currentValue : 512
        this.potValues.set(pot.id, val)
        this.board.setExternalInput(pot.pin, { analog: val })
        break
      }

      case 'digital_sensor': {
        const ds = config as VirtualDigitalSensorConfig
        this.digitalSensorStates.set(ds.id, false)
        const digVal: DigitalValue = ds.activeHigh === false ? 1 : 0
        this.board.setExternalInput(ds.pin, { digital: digVal })
        break
      }

      case 'analog_sensor': {
        const as = config as VirtualAnalogSensorConfig
        const val = as.currentValue !== undefined ? as.currentValue : 300
        this.analogSensorValues.set(as.id, val)
        this.board.setExternalInput(as.pin, { analog: val })
        break
      }

      case 'ultrasonic': {
        const us = config as VirtualUltrasonicConfig
        const dist = us.distanceCm !== undefined ? us.distanceCm : 50
        this.ultrasonicDistances.set(us.id, dist)
        break
      }
    }
  }

  // -----------------------------------------------------------------------
  // Interactive User Actions
  // -----------------------------------------------------------------------

  /**
   * Updates a virtual button pressed state (pressed = true / false).
   */
  public setButtonPressed(componentId: string, pressed: boolean): void {
    const comp = this.components.get(componentId)
    if (!comp || comp.type !== 'button') return
    const btn = comp as VirtualButtonConfig
    this.buttonStates.set(btn.id, pressed)
    this.applyButtonState(btn, pressed)
    this.notify(componentId, { pressed })
  }

  private applyButtonState(btn: VirtualButtonConfig, pressed: boolean): void {
    const activeLow = btn.activeLow !== false // default activeLow (INPUT_PULLUP)
    // If activeLow: unpressed is HIGH (1), pressed is LOW (0)
    // If activeHigh: unpressed is LOW (0), pressed is HIGH (1)
    const digVal: DigitalValue = activeLow ? (pressed ? 0 : 1) : pressed ? 1 : 0
    this.board.setExternalInput(btn.pin, { digital: digVal })
  }

  public isButtonPressed(componentId: string): boolean {
    return this.buttonStates.get(componentId) || false
  }

  /**
   * Sets the potentiometer value (0 - 1023).
   */
  public setPotentiometerValue(componentId: string, value: number): void {
    const comp = this.components.get(componentId)
    if (!comp || comp.type !== 'potentiometer') return
    const pot = comp as VirtualPotentiometerConfig
    const clamped = Math.max(0, Math.min(1023, Math.round(value)))
    this.potValues.set(pot.id, clamped)
    this.board.setExternalInput(pot.pin, { analog: clamped })
    this.notify(componentId, {
      value: clamped,
      voltage: (clamped / 1023) * this.board.capabilities.voltage
    })
  }

  public getPotentiometerValue(componentId: string): number {
    return this.potValues.get(componentId) ?? 512
  }

  /**
   * Sets generic digital sensor state.
   */
  public setDigitalSensorActive(componentId: string, active: boolean): void {
    const comp = this.components.get(componentId)
    if (!comp || comp.type !== 'digital_sensor') return
    const ds = comp as VirtualDigitalSensorConfig
    this.digitalSensorStates.set(ds.id, active)
    const activeHigh = ds.activeHigh !== false
    const digVal: DigitalValue = activeHigh ? (active ? 1 : 0) : active ? 0 : 1
    this.board.setExternalInput(ds.pin, { digital: digVal })
    this.notify(componentId, { active, digitalValue: digVal })
  }

  public isDigitalSensorActive(componentId: string): boolean {
    return this.digitalSensorStates.get(componentId) || false
  }

  /**
   * Sets generic analog sensor value.
   */
  public setAnalogSensorValue(componentId: string, value: number): void {
    const comp = this.components.get(componentId)
    if (!comp || comp.type !== 'analog_sensor') return
    const as = comp as VirtualAnalogSensorConfig
    const clamped = Math.max(0, Math.min(1023, Math.round(value)))
    this.analogSensorValues.set(as.id, clamped)
    this.board.setExternalInput(as.pin, { analog: clamped })
    this.notify(componentId, { value: clamped })
  }

  public getAnalogSensorValue(componentId: string): number {
    return this.analogSensorValues.get(componentId) ?? 300
  }

  /**
   * Sets ultrasonic distance in centimeters (2 - 400).
   */
  public setUltrasonicDistance(componentId: string, distanceCm: number): void {
    const comp = this.components.get(componentId)
    if (!comp || comp.type !== 'ultrasonic') return
    const clamped = Math.max(2, Math.min(400, Math.round(distanceCm)))
    this.ultrasonicDistances.set(componentId, clamped)
    this.notify(componentId, { distanceCm: clamped })
  }

  public getUltrasonicDistance(componentId: string): number {
    return this.ultrasonicDistances.get(componentId) ?? 50
  }

  /**
   * Returns current distance for an ultrasonic sensor by trig and echo pins.
   */
  public getUltrasonicDistanceByPins(trigPin: string, echoPin: string): number {
    const normTrig = this.board.normalizePinId(trigPin)
    const normEcho = this.board.normalizePinId(echoPin)

    for (const comp of this.components.values()) {
      if (comp.type === 'ultrasonic') {
        const us = comp as VirtualUltrasonicConfig
        if (
          this.board.normalizePinId(us.trigPin) === normTrig &&
          this.board.normalizePinId(us.echoPin) === normEcho
        ) {
          return this.ultrasonicDistances.get(us.id) ?? 50
        }
      }
    }
    // Default fallback if no matching component is mounted
    return 50
  }

  /**
   * Queries visual state of an LED connected to a pin.
   */
  public getLedState(componentId: string): { isOn: boolean; brightness: number; pin: string } {
    const comp = this.components.get(componentId)
    if (!comp || comp.type !== 'led') {
      return { isOn: false, brightness: 0, pin: '' }
    }
    const led = comp as VirtualLedConfig
    const pinState = this.board.getPin(led.pin)
    if (!pinState) {
      return { isOn: false, brightness: 0, pin: led.pin }
    }

    const isOn = pinState.digitalValue === 1 || pinState.pwmValue > 0
    const brightness =
      pinState.pwmValue > 0 ? Math.round((pinState.pwmValue / 255) * 100) : isOn ? 100 : 0

    return { isOn, brightness, pin: led.pin }
  }

  /**
   * Resets all component states to their initial defaults.
   */
  public reset(): void {
    for (const comp of this.components.values()) {
      this.initializeComponentState(comp)
    }
  }
}
