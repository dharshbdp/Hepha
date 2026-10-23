/**
 * SimulationEngine — Virtual Hardware Execution & Orchestration Engine
 * Coordinates VirtualBoard, VirtualClock, VirtualSerial, VirtualComponents,
 * and executes compiled Blockly program IR in an event-driven, non-blocking lifecycle.
 */

import { VirtualBoard } from './virtualBoard'
import { VirtualClock } from './virtualClock'
import { VirtualSerial } from './virtualSerial'
import { VirtualComponentRegistry } from './components'
import { SimulationAdapter } from './simulationAdapter'
import type {
  SimulationStatus,
  CompiledSimulationProgram,
  Instruction,
  Expr,
  SimulationEvent,
  SimulationEventListener,
  VirtualCircuitConfig,
  DigitalValue
} from './types'

export interface SimulationEngineOptions {
  speedMultiplier?: number
  maxStepBudgetPerSlice?: number
}

export class SimulationEngine {
  public readonly board: VirtualBoard
  public readonly clock: VirtualClock
  public readonly serial: VirtualSerial
  public readonly components: VirtualComponentRegistry
  public readonly adapter: SimulationAdapter

  private status: SimulationStatus = 'idle'
  private program: CompiledSimulationProgram | null = null
  private variables: Map<string, number | string | boolean> = new Map()
  private listeners: SimulationEventListener[] = []

  // Execution scheduler state
  private timerId: ReturnType<typeof setTimeout> | null = null
  private isExecutingSlice = false
  private instructionIndex = 0
  private isSetupDone = false
  private currentLoopIteration = 0
  private maxStepBudgetPerSlice = 1000
  private executionCount = 0

  constructor(boardId = 'arduino_uno', options?: SimulationEngineOptions) {
    this.board = new VirtualBoard(boardId)
    this.clock = new VirtualClock(options?.speedMultiplier ?? 1.0)
    this.serial = new VirtualSerial()
    this.components = new VirtualComponentRegistry(this.board)
    this.adapter = new SimulationAdapter(this.board)

    if (options?.maxStepBudgetPerSlice) {
      this.maxStepBudgetPerSlice = options.maxStepBudgetPerSlice
    }

    // Forward internal events
    this.board.subscribe((event) => this.emit(event))
    this.serial.subscribe((event) => this.emit(event))
    this.components.subscribe((update) => {
      this.emit({
        type: 'component_change',
        componentId: update.componentId,
        state: update.state
      })
    })
  }

  public subscribe(listener: SimulationEventListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private emit(event: SimulationEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (err) {
        console.error('SimulationEngine event listener error:', err)
      }
    }
  }

  private setStatus(newStatus: SimulationStatus, reason?: string): void {
    if (this.status !== newStatus) {
      this.status = newStatus
      this.emit({ type: 'status_change', status: newStatus, reason })
    }
  }

  public getStatus(): SimulationStatus {
    return this.status
  }

  public getProgram(): CompiledSimulationProgram | null {
    return this.program
  }

  public getVariable(name: string): number | string | boolean | undefined {
    return this.variables.get(name)
  }

  public getAllVariables(): Record<string, number | string | boolean> {
    const obj: Record<string, number | string | boolean> = {}
    for (const [k, v] of this.variables.entries()) {
      obj[k] = v
    }
    return obj
  }

  /**
   * Loads and compiles a Blockly program.
   */
  public loadProgram(workspaceInput: unknown, boardId?: string): CompiledSimulationProgram {
    this.reset(true)
    this.program = this.adapter.compile(
      workspaceInput as Record<string, unknown>,
      boardId || this.board.capabilities.id
    )

    for (const diag of this.program.diagnostics) {
      this.emit({ type: 'diagnostic', diagnostic: diag })
    }

    return this.program
  }

  /**
   * Loads a virtual circuit configuration (components and pin bindings).
   */
  public loadCircuitConfig(circuitConfig: VirtualCircuitConfig): void {
    this.components.clear()
    for (const comp of circuitConfig.components) {
      this.components.addComponent(comp)
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle Controls (Run, Pause, Resume, Reset, Step, Stop)
  // -----------------------------------------------------------------------

  /**
   * Starts simulation from the beginning.
   */
  public start(): boolean {
    if (!this.program || (this.program.setup.length === 0 && this.program.loop.length === 0)) {
      this.emit({
        type: 'diagnostic',
        diagnostic: {
          severity: 'error',
          message: 'Cannot start simulation: No program loaded or workspace is empty.'
        }
      })
      this.setStatus('error', 'No program loaded')
      return false
    }

    this.reset(false)
    this.setStatus('running')
    this.scheduleNextSlice(0)
    return true
  }

  /**
   * Pauses running simulation without losing state.
   */
  public pause(): void {
    if (this.status !== 'running') return
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    this.setStatus('paused')
  }

  /**
   * Resumes paused simulation.
   */
  public resume(): void {
    if (this.status !== 'paused') return
    this.setStatus('running')
    this.scheduleNextSlice(0)
  }

  /**
   * Executes a single instruction step.
   */
  public step(): boolean {
    if (!this.program) return false

    if (this.status === 'running') {
      this.pause()
    }

    this.executeSingleStep()
    this.setStatus('paused', 'Stepped')
    return true
  }

  /**
   * Stops simulation and cancels pending tasks.
   */
  public stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    this.isExecutingSlice = false
    this.setStatus('stopped')
  }

  /**
   * Resets virtual hardware, clock, variables, and restarts to initial state.
   */
  public reset(resetComponents = false): void {
    this.stop()
    this.clock.reset()
    this.board.reset()
    this.serial.clear()
    this.variables.clear()
    this.instructionIndex = 0
    this.isSetupDone = false
    this.currentLoopIteration = 0
    this.executionCount = 0

    if (resetComponents) {
      this.components.reset()
    } else {
      // Re-apply current interactive component states to board inputs
      for (const comp of this.components.getAllComponents()) {
        if (comp.type === 'button') {
          const btn = comp as import('./types').VirtualButtonConfig
          const pressed = this.components.isButtonPressed(btn.id)
          const activeLow = btn.activeLow !== false
          const digVal: DigitalValue = activeLow ? (pressed ? 0 : 1) : pressed ? 1 : 0
          this.board.setExternalInput(btn.pin, { digital: digVal })
        } else if (comp.type === 'potentiometer') {
          const val = this.components.getPotentiometerValue(comp.id)
          this.board.setExternalInput((comp as import('./types').VirtualPotentiometerConfig).pin, {
            analog: val
          })
        } else if (comp.type === 'analog_sensor') {
          const val = this.components.getAnalogSensorValue(comp.id)
          this.board.setExternalInput((comp as import('./types').VirtualAnalogSensorConfig).pin, {
            analog: val
          })
        } else if (comp.type === 'digital_sensor') {
          const ds = comp as import('./types').VirtualDigitalSensorConfig
          const active = this.components.isDigitalSensorActive(ds.id)
          const digVal: DigitalValue = ds.activeHigh !== false ? (active ? 1 : 0) : active ? 0 : 1
          this.board.setExternalInput(ds.pin, { digital: digVal })
        }
      }
    }

    this.emit({
      type: 'time_tick',
      elapsedMs: 0,
      elapsedUs: 0
    })
    this.setStatus('idle')
  }

  /**
   * Sets the playback speed multiplier (e.g. 0.25x, 0.5x, 1x, 2x, 4x).
   */
  public setSpeed(multiplier: number): void {
    this.clock.setSpeed(multiplier)
  }

  public getSpeed(): number {
    return this.clock.getSpeed()
  }

  // -----------------------------------------------------------------------
  // Execution Dispatcher & Non-Blocking Scheduler
  // -----------------------------------------------------------------------

  private scheduleNextSlice(delayMs = 0): void {
    if (this.status !== 'running') return

    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }

    // Scale delay by speedMultiplier
    const speed = this.clock.getSpeed()
    const wallDelayMs = delayMs > 0 ? Math.max(1, Math.round(delayMs / speed)) : 0

    this.timerId = setTimeout(() => {
      this.timerId = null
      this.runSlice()
    }, wallDelayMs)
  }

  private runSlice(): void {
    if (this.status !== 'running' || this.isExecutingSlice) return
    this.isExecutingSlice = true

    let stepsExecuted = 0
    let pendingDelayMs = 0

    try {
      while (stepsExecuted < this.maxStepBudgetPerSlice && this.status === 'running') {
        const delayResult = this.executeSingleStep()
        stepsExecuted++

        if (delayResult > 0) {
          pendingDelayMs = delayResult
          break
        }
      }
    } catch (err) {
      this.emit({
        type: 'diagnostic',
        diagnostic: {
          severity: 'error',
          message: `Simulation runtime error: ${err instanceof Error ? err.message : String(err)}`
        }
      })
      this.setStatus('error', String(err))
      this.isExecutingSlice = false
      return
    }

    this.isExecutingSlice = false

    if (this.status === 'running') {
      this.scheduleNextSlice(pendingDelayMs)
    }
  }

  /**
   * Executes a single instruction step.
   * Returns delayMs if this instruction was a delay, or 0 if instantaneous.
   */
  private executeSingleStep(): number {
    if (!this.program) return 0

    // Setup Phase
    if (!this.isSetupDone) {
      if (this.instructionIndex < this.program.setup.length) {
        const ins = this.program.setup[this.instructionIndex++]
        const delay = this.executeInstruction(ins)
        this.executionCount++
        this.emit({ type: 'step_done', instructionCount: this.executionCount })
        return delay
      } else {
        this.isSetupDone = true
        this.instructionIndex = 0
      }
    }

    // Loop Phase
    if (this.program.loop.length === 0) {
      // No loop body, simulation finishes
      this.setStatus('stopped', 'Program completed')
      return 0
    }

    if (this.instructionIndex >= this.program.loop.length) {
      this.instructionIndex = 0
      this.currentLoopIteration++
    }

    const ins = this.program.loop[this.instructionIndex++]
    const delay = this.executeInstruction(ins)
    this.executionCount++
    this.emit({ type: 'step_done', instructionCount: this.executionCount })

    return delay
  }

  // -----------------------------------------------------------------------
  // Instruction Executor
  // -----------------------------------------------------------------------

  private executeInstruction(ins: Instruction): number {
    const curUs = this.clock.getElapsedMicros()

    switch (ins.op) {
      case 'PIN_MODE': {
        this.board.setPinMode(ins.pin, ins.mode, curUs)
        return 0
      }

      case 'DIGITAL_WRITE': {
        const val = this.evaluateExpr(ins.valueExpr)
        const digVal: DigitalValue = val ? 1 : 0
        this.board.digitalWrite(ins.pin, digVal, curUs)
        return 0
      }

      case 'ANALOG_WRITE': {
        const val = Number(this.evaluateExpr(ins.valueExpr))
        this.board.analogWrite(ins.pin, isNaN(val) ? 0 : val, curUs)
        return 0
      }

      case 'DELAY': {
        const ms = Number(this.evaluateExpr(ins.durationMsExpr))
        const clampedMs = Math.max(0, Math.round(isNaN(ms) ? 0 : ms))
        this.clock.advanceMillis(clampedMs)
        this.emit({
          type: 'time_tick',
          elapsedMs: this.clock.getElapsedMillis(),
          elapsedUs: this.clock.getElapsedMicros()
        })
        return clampedMs
      }

      case 'DELAY_MICROS': {
        const us = Number(this.evaluateExpr(ins.durationUsExpr))
        const clampedUs = Math.max(0, Math.round(isNaN(us) ? 0 : us))
        this.clock.advanceMicros(clampedUs)
        this.emit({
          type: 'time_tick',
          elapsedMs: this.clock.getElapsedMillis(),
          elapsedUs: this.clock.getElapsedMicros()
        })
        return Math.floor(clampedUs / 1000)
      }

      case 'SERIAL_PRINT': {
        const content = this.evaluateExpr(ins.contentExpr)
        this.serial.print(content, this.clock.getElapsedMillis(), ins.newline)
        return 0
      }

      case 'SET_VAR': {
        const val = this.evaluateExpr(ins.valueExpr)
        this.variables.set(ins.varName, val)
        return 0
      }

      case 'IF_BRANCH': {
        const cond = Boolean(this.evaluateExpr(ins.conditionExpr))
        if (cond) {
          for (const bodyIns of ins.thenBody) {
            this.executeInstruction(bodyIns)
          }
        } else if (ins.elseBody && ins.elseBody.length > 0) {
          for (const bodyIns of ins.elseBody) {
            this.executeInstruction(bodyIns)
          }
        }
        return 0
      }

      case 'WHILE_LOOP': {
        let iterations = 0
        const maxIter = ins.maxIterations || 10000
        while (Boolean(this.evaluateExpr(ins.conditionExpr)) && iterations < maxIter) {
          for (const bodyIns of ins.body) {
            this.executeInstruction(bodyIns)
          }
          iterations++
        }
        if (iterations >= maxIter) {
          this.emit({
            type: 'diagnostic',
            diagnostic: {
              severity: 'warning',
              message: `While loop exceeded maximum limit of ${maxIter} iterations. Safety break applied.`,
              blockId: ins.blockId
            }
          })
        }
        return 0
      }

      case 'FOR_LOOP': {
        const from = Number(this.evaluateExpr(ins.fromExpr))
        const to = Number(this.evaluateExpr(ins.toExpr))
        const by = Number(this.evaluateExpr(ins.byExpr)) || 1

        let iterations = 0
        const maxIter = 10000
        for (let i = from; by > 0 ? i <= to : i >= to; i += by) {
          this.variables.set(ins.varName, i)
          for (const bodyIns of ins.body) {
            this.executeInstruction(bodyIns)
          }
          iterations++
          if (iterations > maxIter) break
        }
        return 0
      }

      case 'SERVO_WRITE': {
        const angle = Number(this.evaluateExpr(ins.angleExpr))
        const clampedAngle = Math.max(0, Math.min(180, Math.round(angle)))
        // Map 0-180 degrees to PWM (0 - 255)
        const pwmEquivalent = Math.round((clampedAngle / 180) * 255)
        this.board.analogWrite(ins.pin, pwmEquivalent, curUs)
        return 0
      }

      case 'RELAY_WRITE': {
        const stateVal = this.evaluateExpr(ins.stateExpr)
        const digVal: DigitalValue = stateVal ? 1 : 0
        this.board.digitalWrite(ins.pin, digVal, curUs)
        return 0
      }

      default:
        return 0
    }
  }

  // -----------------------------------------------------------------------
  // Expression Evaluator
  // -----------------------------------------------------------------------

  public evaluateExpr(expr: Expr): number | string | boolean {
    switch (expr.type) {
      case 'literal_number':
        return expr.value

      case 'literal_string':
        return expr.value

      case 'literal_boolean':
        return expr.value

      case 'variable': {
        const val = this.variables.get(expr.name)
        return val !== undefined ? val : 0
      }

      case 'unary_not': {
        const sub = this.evaluateExpr(expr.expr)
        return !sub
      }

      case 'read_digital_pin': {
        return this.board.digitalRead(expr.pin)
      }

      case 'read_analog_pin': {
        return this.board.analogRead(expr.pin)
      }

      case 'read_millis': {
        return this.clock.getElapsedMillis()
      }

      case 'read_micros': {
        return this.clock.getElapsedMicros()
      }

      case 'read_ultrasonic': {
        return this.components.getUltrasonicDistanceByPins(expr.trigPin, expr.echoPin)
      }

      case 'binary_op': {
        const leftVal = this.evaluateExpr(expr.left)
        const rightVal = this.evaluateExpr(expr.right)

        switch (expr.op) {
          case 'EQ':
            return String(leftVal) === String(rightVal)
          case 'NEQ':
            return String(leftVal) !== String(rightVal)
          case 'LT':
            return Number(leftVal) < Number(rightVal)
          case 'LTE':
            return Number(leftVal) <= Number(rightVal)
          case 'GT':
            return Number(leftVal) > Number(rightVal)
          case 'GTE':
            return Number(leftVal) >= Number(rightVal)
          case 'AND':
            return Boolean(leftVal) && Boolean(rightVal)
          case 'OR':
            return Boolean(leftVal) || Boolean(rightVal)
          case 'ADD':
            if (typeof leftVal === 'string' || typeof rightVal === 'string') {
              return String(leftVal) + String(rightVal)
            }
            return Number(leftVal) + Number(rightVal)
          case 'MINUS':
            return Number(leftVal) - Number(rightVal)
          case 'MULTIPLY':
            return Number(leftVal) * Number(rightVal)
          case 'DIVIDE': {
            const r = Number(rightVal)
            return r !== 0 ? Number(leftVal) / r : 0
          }
          case 'MODULO': {
            const r = Number(rightVal)
            return r !== 0 ? Number(leftVal) % r : 0
          }
          default:
            return 0
        }
      }

      default:
        return 0
    }
  }
}
