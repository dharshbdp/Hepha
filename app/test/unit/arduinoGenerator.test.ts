import { describe, it, expect, beforeAll } from 'vitest'
import * as Blockly from 'blockly'
import { registerHardwareBlocks } from '../../src/core/blocks'
import { arduinoGenerator } from '../../src/core/compiler'

describe('Arduino C++ Code Generation (arduinoGenerator)', () => {
  beforeAll(() => {
    registerHardwareBlocks()
  })

  it('generates basic sketch scaffolding with setup() and loop()', () => {
    const workspace = new Blockly.Workspace()
    const code = arduinoGenerator.workspaceToCode(workspace)

    expect(code).toContain('// Hepha — Generated Sketch')
    expect(code).toContain('void setup() {')
    expect(code).toContain('void loop() {')
  })

  it('generates digital write and pinMode setup', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('pin_digital_write')
    block.setFieldValue('13', 'PIN')
    block.setFieldValue('HIGH', 'STATE')

    const code = arduinoGenerator.workspaceToCode(workspace)
    expect(code).toContain('pinMode(13, OUTPUT);')
    expect(code).toContain('digitalWrite(13, HIGH);')
  })

  it('generates analog PWM write', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('pin_analog_write')
    block.setFieldValue('9', 'PIN')

    // Connect a number block to VALUE
    const numBlock = workspace.newBlock('math_number')
    numBlock.setFieldValue('180', 'NUM')
    block.getInput('VALUE')?.connection?.connect(numBlock.outputConnection)

    const code = arduinoGenerator.workspaceToCode(workspace)
    expect(code).toContain('pinMode(9, OUTPUT);')
    expect(code).toContain('analogWrite(9, 180);')
  })

  it('generates delay timing statements', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('time_delay')
    const numBlock = workspace.newBlock('math_number')
    numBlock.setFieldValue('500', 'NUM')
    block.getInput('DELAY_MS')?.connection?.connect(numBlock.outputConnection)

    const code = arduinoGenerator.workspaceToCode(workspace)
    expect(code).toContain('delay(500);')
  })

  it('generates servo library inclusion, object declaration, and angle write', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('actuator_servo')
    block.setFieldValue('9', 'PIN')
    const angleBlock = workspace.newBlock('math_number')
    angleBlock.setFieldValue('90', 'NUM')
    block.getInput('ANGLE')?.connection?.connect(angleBlock.outputConnection)

    const code = arduinoGenerator.workspaceToCode(workspace)
    expect(code).toContain('#include <Servo.h>')
    expect(code).toContain('Servo servo_9;')
    expect(code).toContain('servo_9.attach(9);')
    expect(code).toContain('servo_9.write(90);')
  })

  it('generates ultrasonic sensor distance measurement routine', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('sensor_ultrasonic')
    block.setFieldValue('9', 'TRIG_PIN')
    block.setFieldValue('10', 'ECHO_PIN')

    const code = arduinoGenerator.blockToCode(block)
    expect(code[0]).toContain('readUltrasonicDistance(9, 10)')

    const fullCode = arduinoGenerator.workspaceToCode(workspace)
    expect(fullCode).toContain('long readUltrasonicDistance(int triggerPin, int echoPin)')
    expect(fullCode).toContain('pulseIn(echoPin, HIGH)')
  })

  it('generates serial print and synchronizes custom baud rate', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('serial_print')
    block.setFieldValue('TRUE', 'NEWLINE')
    const textBlock = workspace.newBlock('text')
    textBlock.setFieldValue('System Active', 'TEXT')
    block.getInput('CONTENT')?.connection?.connect(textBlock.outputConnection)

    const code = arduinoGenerator.workspaceToCode(workspace, 9600)
    expect(code).toContain('Serial.begin(9600);')
    expect(code).toContain('Serial.println("System Active");')
  })

  it('generates NeoPixel initialization and color assignment', () => {
    const workspace = new Blockly.Workspace()
    const initBlock = workspace.newBlock('neopixel_init')
    initBlock.setFieldValue('6', 'PIN')
    const countBlock = workspace.newBlock('math_number')
    countBlock.setFieldValue('8', 'NUM')
    initBlock.getInput('COUNT')?.connection?.connect(countBlock.outputConnection)

    const colorBlock = workspace.newBlock('neopixel_set_color')
    colorBlock.setFieldValue('6', 'PIN')

    const pixelBlock = workspace.newBlock('math_number')
    pixelBlock.setFieldValue('0', 'NUM')
    colorBlock.getInput('PIXEL')?.connection?.connect(pixelBlock.outputConnection)

    const rBlock = workspace.newBlock('math_number')
    rBlock.setFieldValue('255', 'NUM')
    colorBlock.getInput('RED')?.connection?.connect(rBlock.outputConnection)

    initBlock.nextConnection?.connect(colorBlock.previousConnection)

    const code = arduinoGenerator.workspaceToCode(workspace)
    expect(code).toContain('#include <Adafruit_NeoPixel.h>')
    expect(code).toContain('Adafruit_NeoPixel strip_6(8, 6, NEO_GRB + NEO_KHZ800);')
    expect(code).toContain('strip_6.begin();')
    expect(code).toContain('strip_6.setPixelColor(0, strip_6.Color(255, 0, 0));')
  })

  it('generates raw C++ code verbatim via raw_cpp_code block', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('raw_cpp_code')
    block.setFieldValue('volatile uint32_t isr_counter = 0;', 'CODE')

    const code = arduinoGenerator.workspaceToCode(workspace)
    expect(code).toContain('volatile uint32_t isr_counter = 0;')
  })
})
