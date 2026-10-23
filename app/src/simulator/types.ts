/**
 * Hepha Virtual Simulation Engine — Type Definitions
 * Defines virtual hardware abstractions, instruction IR, events, and component models.
 */

export type PinMode = 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP'
export type DigitalValue = 0 | 1
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error'

export interface VirtualPin {
  id: string
  name: string
  mode: PinMode
  digitalValue: DigitalValue
  analogValue: number // 0 - 1023 (10-bit ADC for Arduino Uno)
  pwmValue: number // 0 - 255 (8-bit PWM)
  isPwmCapable: boolean
  isAnalogCapable: boolean
  lastChangedUs: number
}

export interface BoardCapabilities {
  id: string
  name: string
  voltage: number
  digitalPins: string[]
  analogPins: string[]
  pwmPins: string[]
  adcResolutionBits: number
}

// -------------------------------------------------------------------------
// Component Models
// -------------------------------------------------------------------------

export type VirtualComponentType =
  'led' | 'button' | 'potentiometer' | 'digital_sensor' | 'analog_sensor' | 'ultrasonic'

export interface BaseVirtualComponentConfig {
  id: string
  type: VirtualComponentType
  name: string
}

export interface VirtualLedConfig extends BaseVirtualComponentConfig {
  type: 'led'
  pin: string
  color?: string
}

export interface VirtualButtonConfig extends BaseVirtualComponentConfig {
  type: 'button'
  pin: string
  activeLow?: boolean // true if using INPUT_PULLUP (default true)
}

export interface VirtualPotentiometerConfig extends BaseVirtualComponentConfig {
  type: 'potentiometer'
  pin: string
  minValue?: number
  maxValue?: number
  currentValue?: number
}

export interface VirtualDigitalSensorConfig extends BaseVirtualComponentConfig {
  type: 'digital_sensor'
  pin: string
  activeHigh?: boolean
}

export interface VirtualAnalogSensorConfig extends BaseVirtualComponentConfig {
  type: 'analog_sensor'
  pin: string
  minValue?: number
  maxValue?: number
  currentValue?: number
}

export interface VirtualUltrasonicConfig extends BaseVirtualComponentConfig {
  type: 'ultrasonic'
  trigPin: string
  echoPin: string
  distanceCm?: number // 2 - 400 cm
}

export type VirtualComponentConfig =
  | VirtualLedConfig
  | VirtualButtonConfig
  | VirtualPotentiometerConfig
  | VirtualDigitalSensorConfig
  | VirtualAnalogSensorConfig
  | VirtualUltrasonicConfig

export interface VirtualCircuitConfig {
  boardId: string
  components: VirtualComponentConfig[]
}

// -------------------------------------------------------------------------
// Simulation Intermediate Representation (IR)
// -------------------------------------------------------------------------

export type BinaryOp =
  | 'EQ'
  | 'NEQ'
  | 'LT'
  | 'LTE'
  | 'GT'
  | 'GTE'
  | 'AND'
  | 'OR'
  | 'ADD'
  | 'MINUS'
  | 'MULTIPLY'
  | 'DIVIDE'
  | 'MODULO'

export type Expr =
  | { type: 'literal_number'; value: number }
  | { type: 'literal_string'; value: string }
  | { type: 'literal_boolean'; value: boolean }
  | { type: 'variable'; name: string }
  | { type: 'binary_op'; op: BinaryOp; left: Expr; right: Expr }
  | { type: 'unary_not'; expr: Expr }
  | { type: 'read_digital_pin'; pin: string }
  | { type: 'read_analog_pin'; pin: string }
  | { type: 'read_millis' }
  | { type: 'read_micros' }
  | { type: 'read_ultrasonic'; trigPin: string; echoPin: string }

export type Instruction =
  | { op: 'PIN_MODE'; pin: string; mode: PinMode; blockId?: string }
  | { op: 'DIGITAL_WRITE'; pin: string; valueExpr: Expr; blockId?: string }
  | { op: 'ANALOG_WRITE'; pin: string; valueExpr: Expr; blockId?: string }
  | { op: 'DELAY'; durationMsExpr: Expr; blockId?: string }
  | { op: 'DELAY_MICROS'; durationUsExpr: Expr; blockId?: string }
  | { op: 'SERIAL_PRINT'; contentExpr: Expr; newline: boolean; blockId?: string }
  | { op: 'SET_VAR'; varName: string; valueExpr: Expr; blockId?: string }
  | {
      op: 'IF_BRANCH'
      conditionExpr: Expr
      thenBody: Instruction[]
      elseBody?: Instruction[]
      blockId?: string
    }
  | {
      op: 'WHILE_LOOP'
      conditionExpr: Expr
      body: Instruction[]
      maxIterations?: number
      blockId?: string
    }
  | {
      op: 'FOR_LOOP'
      varName: string
      fromExpr: Expr
      toExpr: Expr
      byExpr: Expr
      body: Instruction[]
      blockId?: string
    }
  | { op: 'SERVO_WRITE'; pin: string; angleExpr: Expr; blockId?: string }
  | { op: 'RELAY_WRITE'; pin: string; stateExpr: Expr; blockId?: string }

export interface CompiledSimulationProgram {
  boardId: string
  setup: Instruction[]
  loop: Instruction[]
  diagnostics: SimulationDiagnostic[]
  blockCount: number
}

// -------------------------------------------------------------------------
// Events & Diagnostics
// -------------------------------------------------------------------------

export type DiagnosticSeverity = 'info' | 'warning' | 'error'

export interface SimulationDiagnostic {
  severity: DiagnosticSeverity
  message: string
  blockId?: string
  pin?: string
  componentId?: string
}

export interface SerialEntry {
  id: string
  text: string
  virtualTimeMs: number
  newline: boolean
}

export type SimulationEvent =
  | { type: 'status_change'; status: SimulationStatus; reason?: string }
  | { type: 'gpio_change'; pin: string; pinState: VirtualPin }
  | { type: 'serial_output'; entry: SerialEntry }
  | { type: 'time_tick'; elapsedMs: number; elapsedUs: number }
  | { type: 'diagnostic'; diagnostic: SimulationDiagnostic }
  | { type: 'step_done'; instructionCount: number }
  | { type: 'component_change'; componentId: string; state: Record<string, unknown> }

export type SimulationEventListener = (event: SimulationEvent) => void
