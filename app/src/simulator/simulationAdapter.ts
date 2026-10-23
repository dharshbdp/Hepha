/**
 * SimulationAdapter — Translates Blockly Workspaces into Executable Simulation IR
 * Parses visual logic AST, resolves pin assignments, handles branches/loops/variables,
 * and outputs typed Instruction sequences along with descriptive diagnostics.
 */

import * as Blockly from 'blockly'
import type {
  CompiledSimulationProgram,
  Instruction,
  Expr,
  BinaryOp,
  SimulationDiagnostic,
  PinMode
} from './types'
import type { VirtualBoard } from './virtualBoard'

interface SerializedBlock {
  type: string
  id?: string
  fields?: Record<string, unknown>
  inputs?: Record<string, { block?: SerializedBlock; shadow?: SerializedBlock }>
  next?: { block?: SerializedBlock }
  extraState?: Record<string, unknown>
}

interface SerializedWorkspace {
  blocks?: {
    blocks?: SerializedBlock[]
  }
  [key: string]: unknown
}

export class SimulationAdapter {
  public readonly board: VirtualBoard
  private diagnostics: SimulationDiagnostic[] = []
  private blockCount = 0

  constructor(board: VirtualBoard) {
    this.board = board
  }

  /**
   * Translates a live Blockly.WorkspaceSvg or serialized JSON workspace into a CompiledSimulationProgram.
   */
  public compile(
    workspaceInput: Blockly.WorkspaceSvg | SerializedWorkspace | Record<string, unknown>,
    boardId = 'arduino_uno'
  ): CompiledSimulationProgram {
    this.diagnostics = []
    this.blockCount = 0

    let serialized: SerializedWorkspace
    if (
      typeof workspaceInput === 'object' &&
      workspaceInput !== null &&
      'getAllBlocks' in workspaceInput &&
      typeof (workspaceInput as Blockly.WorkspaceSvg).getAllBlocks === 'function'
    ) {
      // Live WorkspaceSvg
      try {
        serialized = Blockly.serialization.workspaces.save(workspaceInput as Blockly.WorkspaceSvg)
      } catch (err) {
        this.diagnostics.push({
          severity: 'error',
          message: `Failed to serialize Blockly workspace: ${err instanceof Error ? err.message : String(err)}`
        })
        return {
          boardId,
          setup: [],
          loop: [],
          diagnostics: this.diagnostics,
          blockCount: 0
        }
      }
    } else {
      serialized = workspaceInput as SerializedWorkspace
    }

    const topBlocks = serialized?.blocks?.blocks || []
    const setupInstructions: Instruction[] = []
    const loopInstructions: Instruction[] = []

    for (const block of topBlocks) {
      const instructions = this.compileBlockChain(block)
      // Top-level blocks run in the main loop cycle
      loopInstructions.push(...instructions)
    }

    return {
      boardId,
      setup: setupInstructions,
      loop: loopInstructions,
      diagnostics: this.diagnostics,
      blockCount: this.blockCount
    }
  }

  private compileBlockChain(block: SerializedBlock | undefined): Instruction[] {
    const list: Instruction[] = []
    let current: SerializedBlock | undefined = block

    while (current) {
      this.blockCount++
      const ins = this.compileSingleStatement(current)
      if (ins) {
        if (Array.isArray(ins)) {
          list.push(...ins)
        } else {
          list.push(ins)
        }
      }
      current = current.next?.block
    }

    return list
  }

  private compileSingleStatement(block: SerializedBlock): Instruction | Instruction[] | null {
    const blockId = block.id

    switch (block.type) {
      // 1. Digital Write
      case 'pin_digital_write': {
        const pin = String(block.fields?.PIN ?? '13')
        const stateStr = String(block.fields?.STATE ?? 'HIGH')
        const val = stateStr === 'HIGH' ? 1 : 0
        return {
          op: 'DIGITAL_WRITE',
          pin,
          valueExpr: { type: 'literal_number', value: val },
          blockId
        }
      }

      // 2. Analog Write (PWM)
      case 'pin_analog_write': {
        const pin = String(block.fields?.PIN ?? '3')
        const valExpr = this.resolveValueInput(block, 'VALUE', { type: 'literal_number', value: 0 })
        return {
          op: 'ANALOG_WRITE',
          pin,
          valueExpr: valExpr,
          blockId
        }
      }

      // 3. Pin Mode Configuration
      case 'pin_set_mode': {
        const pin = String(block.fields?.PIN ?? '13')
        const mode = String(block.fields?.MODE ?? 'OUTPUT') as PinMode
        return {
          op: 'PIN_MODE',
          pin,
          mode,
          blockId
        }
      }

      // 4. Delay Milliseconds
      case 'time_delay': {
        const durExpr = this.resolveValueInput(block, 'DELAY_MS', {
          type: 'literal_number',
          value: 100
        })
        return {
          op: 'DELAY',
          durationMsExpr: durExpr,
          blockId
        }
      }

      // 5. Delay Microseconds
      case 'time_delay_micros': {
        const durExpr = this.resolveValueInput(block, 'DELAY_US', {
          type: 'literal_number',
          value: 10
        })
        return {
          op: 'DELAY_MICROS',
          durationUsExpr: durExpr,
          blockId
        }
      }

      // 6. Serial Print
      case 'serial_print': {
        const contentExpr = this.resolveValueInput(block, 'CONTENT', {
          type: 'literal_string',
          value: ''
        })
        const newline = Boolean(block.fields?.NEWLINE ?? true)
        return {
          op: 'SERIAL_PRINT',
          contentExpr,
          newline,
          blockId
        }
      }

      // 7. Servo Actuator
      case 'actuator_servo': {
        const pin = String(block.fields?.PIN ?? '9')
        const angleExpr = this.resolveValueInput(block, 'ANGLE', {
          type: 'literal_number',
          value: 90
        })
        return {
          op: 'SERVO_WRITE',
          pin,
          angleExpr,
          blockId
        }
      }

      // 8. Relay Actuator
      case 'actuator_relay': {
        const pin = String(block.fields?.PIN ?? '7')
        const stateStr = String(block.fields?.STATE ?? 'HIGH')
        const stateVal = stateStr === 'HIGH' || stateStr === 'ON' ? 1 : 0
        return {
          op: 'RELAY_WRITE',
          pin,
          stateExpr: { type: 'literal_number', value: stateVal },
          blockId
        }
      }

      // 9. Controls If / Else
      case 'controls_if': {
        const condExpr = this.resolveValueInput(block, 'IF0', {
          type: 'literal_boolean',
          value: true
        })
        const thenBlock = block.inputs?.DO0?.block
        const elseBlock = block.inputs?.ELSE?.block

        const thenBody = thenBlock ? this.compileBlockChain(thenBlock) : []
        const elseBody = elseBlock ? this.compileBlockChain(elseBlock) : undefined

        return {
          op: 'IF_BRANCH',
          conditionExpr: condExpr,
          thenBody,
          elseBody,
          blockId
        }
      }

      // 10. Repeat X times
      case 'controls_repeat_ext': {
        const timesExpr = this.resolveValueInput(block, 'TIMES', {
          type: 'literal_number',
          value: 10
        })
        const doBlock = block.inputs?.DO?.block
        const body = doBlock ? this.compileBlockChain(doBlock) : []

        return {
          op: 'FOR_LOOP',
          varName: `__repeat_${blockId || Math.random().toString(36).substring(2, 7)}`,
          fromExpr: { type: 'literal_number', value: 0 },
          toExpr: timesExpr,
          byExpr: { type: 'literal_number', value: 1 },
          body,
          blockId
        }
      }

      // 11. While / Until
      case 'controls_whileUntil': {
        const mode = String(block.fields?.MODE ?? 'WHILE')
        let condExpr = this.resolveValueInput(block, 'BOOL', {
          type: 'literal_boolean',
          value: true
        })
        if (mode === 'UNTIL') {
          condExpr = { type: 'unary_not', expr: condExpr }
        }
        const doBlock = block.inputs?.DO?.block
        const body = doBlock ? this.compileBlockChain(doBlock) : []

        return {
          op: 'WHILE_LOOP',
          conditionExpr: condExpr,
          body,
          maxIterations: 10000,
          blockId
        }
      }

      // 12. For loop
      case 'controls_for': {
        const varName = String(
          (block.fields?.VAR as { id?: string; name?: string })?.name ?? block.fields?.VAR ?? 'i'
        )
        const fromExpr = this.resolveValueInput(block, 'FROM', {
          type: 'literal_number',
          value: 0
        })
        const toExpr = this.resolveValueInput(block, 'TO', { type: 'literal_number', value: 10 })
        const byExpr = this.resolveValueInput(block, 'BY', { type: 'literal_number', value: 1 })
        const doBlock = block.inputs?.DO?.block
        const body = doBlock ? this.compileBlockChain(doBlock) : []

        return {
          op: 'FOR_LOOP',
          varName,
          fromExpr,
          toExpr,
          byExpr,
          body,
          blockId
        }
      }

      // 13. Variables Set
      case 'variables_set': {
        const varName = String(
          (block.fields?.VAR as { id?: string; name?: string })?.name ?? block.fields?.VAR ?? 'item'
        )
        const valExpr = this.resolveValueInput(block, 'VALUE', {
          type: 'literal_number',
          value: 0
        })
        return {
          op: 'SET_VAR',
          varName,
          valueExpr: valExpr,
          blockId
        }
      }

      // 14. MQ-2 Warmup (simulates 20s warm-up by advancing virtual time / delay)
      case 'sensor_mq2_warmup': {
        const secExpr = this.resolveValueInput(block, 'SECONDS', {
          type: 'literal_number',
          value: 20
        })
        return {
          op: 'DELAY',
          durationMsExpr: {
            type: 'binary_op',
            op: 'MULTIPLY',
            left: secExpr,
            right: { type: 'literal_number', value: 1000 }
          },
          blockId
        }
      }

      // 15. NeoPixel Initializer & Clear (Simulated via serial diagnostic / virtual acknowledgement)
      case 'neopixel_init':
      case 'neopixel_set_color':
      case 'neopixel_clear': {
        return null // Visual displays can be acknowledged without halting
      }

      // Unsupported Blocks
      default: {
        this.diagnostics.push({
          severity: 'warning',
          message: `Block type '${block.type}' is not supported in the virtual simulation engine. It was skipped.`,
          blockId
        })
        return null
      }
    }
  }

  // -----------------------------------------------------------------------
  // Expression Compilation
  // -----------------------------------------------------------------------

  public resolveValueInput(
    parentBlock: SerializedBlock,
    inputName: string,
    defaultExpr: Expr
  ): Expr {
    const inputSlot = parentBlock.inputs?.[inputName]
    const childBlock = inputSlot?.block || inputSlot?.shadow
    if (!childBlock) {
      return defaultExpr
    }
    return this.compileExpression(childBlock)
  }

  private compileExpression(block: SerializedBlock): Expr {
    this.blockCount++

    switch (block.type) {
      // 1. Math Number
      case 'math_number': {
        const num = Number(block.fields?.NUM ?? 0)
        return { type: 'literal_number', value: isNaN(num) ? 0 : num }
      }

      // 2. Text String
      case 'text': {
        const str = String(block.fields?.TEXT ?? '')
        return { type: 'literal_string', value: str }
      }

      // 3. Logic Boolean
      case 'logic_boolean': {
        const val = String(block.fields?.BOOL ?? 'TRUE') === 'TRUE'
        return { type: 'literal_boolean', value: val }
      }

      // 4. Variables Get
      case 'variables_get': {
        const varName = String(
          (block.fields?.VAR as { id?: string; name?: string })?.name ?? block.fields?.VAR ?? 'item'
        )
        return { type: 'variable', name: varName }
      }

      // 5. Digital Read Pin
      case 'pin_digital_read': {
        const pin = String(block.fields?.PIN ?? '2')
        return { type: 'read_digital_pin', pin }
      }

      // 6. Analog Read Pin
      case 'pin_analog_read': {
        const pin = String(block.fields?.PIN ?? 'A0')
        return { type: 'read_analog_pin', pin }
      }

      // 7. System Runtime Millis
      case 'time_millis': {
        return { type: 'read_millis' }
      }

      // 8. Ultrasonic Distance Sensor
      case 'sensor_ultrasonic': {
        const trigPin = String(block.fields?.TRIG_PIN ?? '9')
        const echoPin = String(block.fields?.ECHO_PIN ?? '10')
        return { type: 'read_ultrasonic', trigPin, echoPin }
      }

      // 9. LDR Ambient Light Sensor
      case 'sensor_light_ldr': {
        const pin = String(block.fields?.PIN ?? 'A0')
        const mode = String(block.fields?.MODE ?? 'RAW')
        const rawExpr: Expr = { type: 'read_analog_pin', pin }
        if (mode === 'PERCENT') {
          return {
            type: 'binary_op',
            op: 'DIVIDE',
            left: {
              type: 'binary_op',
              op: 'MULTIPLY',
              left: rawExpr,
              right: { type: 'literal_number', value: 100 }
            },
            right: { type: 'literal_number', value: 1023 }
          }
        }
        return rawExpr
      }

      // 10. PIR Motion Sensor
      case 'sensor_pir': {
        const pin = String(block.fields?.PIN ?? '2')
        return { type: 'read_digital_pin', pin }
      }

      // 11. MQ-2 Gas Read
      case 'sensor_mq2_read': {
        const pin = String(block.fields?.PIN ?? 'A0')
        return { type: 'read_analog_pin', pin }
      }
      case 'sensor_mq2_digital': {
        const pin = String(block.fields?.PIN ?? '3')
        return { type: 'read_digital_pin', pin }
      }

      // 12. Logic Compare (EQ, NEQ, LT, LTE, GT, GTE)
      case 'logic_compare': {
        const opStr = String(block.fields?.OP ?? 'EQ') as BinaryOp
        const left = this.resolveValueInput(block, 'A', { type: 'literal_number', value: 0 })
        const right = this.resolveValueInput(block, 'B', { type: 'literal_number', value: 0 })
        return {
          type: 'binary_op',
          op: opStr,
          left,
          right
        }
      }

      // 13. Logic Operation (AND, OR)
      case 'logic_operation': {
        const opStr = String(block.fields?.OP ?? 'AND') as BinaryOp
        const left = this.resolveValueInput(block, 'A', { type: 'literal_boolean', value: true })
        const right = this.resolveValueInput(block, 'B', { type: 'literal_boolean', value: true })
        return {
          type: 'binary_op',
          op: opStr,
          left,
          right
        }
      }

      // 14. Logic Negate (NOT)
      case 'logic_negate': {
        const sub = this.resolveValueInput(block, 'BOOL', { type: 'literal_boolean', value: false })
        return { type: 'unary_not', expr: sub }
      }

      // 15. Math Arithmetic (ADD, MINUS, MULTIPLY, DIVIDE)
      case 'math_arithmetic': {
        const opStr = String(block.fields?.OP ?? 'ADD') as BinaryOp
        const left = this.resolveValueInput(block, 'A', { type: 'literal_number', value: 0 })
        const right = this.resolveValueInput(block, 'B', { type: 'literal_number', value: 0 })
        return {
          type: 'binary_op',
          op: opStr,
          left,
          right
        }
      }

      // 16. Text Join
      case 'text_join': {
        // Concatenates ADD0, ADD1, etc.
        const add0 = this.resolveValueInput(block, 'ADD0', { type: 'literal_string', value: '' })
        const add1 = this.resolveValueInput(block, 'ADD1', { type: 'literal_string', value: '' })
        return {
          type: 'binary_op',
          op: 'ADD',
          left: add0,
          right: add1
        }
      }

      default: {
        this.diagnostics.push({
          severity: 'warning',
          message: `Expression block '${block.type}' is not recognized in simulation. Defaulting to 0.`,
          blockId: block.id
        })
        return { type: 'literal_number', value: 0 }
      }
    }
  }
}
