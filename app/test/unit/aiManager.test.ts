import { describe, it, expect, beforeAll } from 'vitest'
import {
  generateOfflineExplanation,
  getAiApiKeyStatus,
  synthesizeBlocks,
  transpileSketchWithAi
} from '../../src/main/ai/aiManager'
import { registerHardwareBlocks } from '../../src/core/blocks'

describe('AI Manager & Offline Resilient Engines (aiManager)', () => {
  beforeAll(() => {
    registerHardwareBlocks()
  })

  it('masks API keys securely in getAiApiKeyStatus', () => {
    const status = getAiApiKeyStatus()
    expect(status).toHaveProperty('isConfigured')
    if (status.isConfigured && status.maskedKey) {
      expect(status.maskedKey).not.toContain('AIzaSy')
      expect(status.maskedKey.length).toBeLessThan(15)
    }
  })

  it('generates rich offline explanation and wiring table for ultrasonic & servo sketch', () => {
    const code = `
#include <Servo.h>
Servo s;
void setup() {
  s.attach(9);
}
void loop() {
  long d = readUltrasonicDistance(7, 8);
  if (d < 20) {
    s.write(90);
  }
}
`
    const result = generateOfflineExplanation({
      boardId: 'arduino_uno',
      code
    })

    expect(result.summary).toBeTruthy()
    expect(result.isAiGenerated).toBe(false)
    expect(result.logicFlow.length).toBeGreaterThan(0)
    expect(result.wiringTable.length).toBeGreaterThan(0)

    // Should detect ultrasonic pins 7 & 8
    const ultraPins = result.wiringTable.filter((w) => w.component.includes('Ultrasonic'))
    expect(ultraPins.length).toBeGreaterThanOrEqual(1)

    // Should detect servo on pin 9
    const servoPins = result.wiringTable.filter((w) => w.component.includes('Servo'))
    expect(servoPins.length).toBeGreaterThanOrEqual(1)
  })

  it('synthesizes blocks offline for natural language prompt', async () => {
    const res = await synthesizeBlocks({
      prompt: 'blink LED on pin 13 every 500 ms',
      boardId: 'arduino_uno',
      mode: 'replace'
    })

    expect(res.success).toBe(true)
    expect(res.blocks.length).toBeGreaterThan(0)
    expect(res.cppCode).toContain('digitalWrite')
    expect(res.explanation).toBeTruthy()
  })

  it('transpiles sketch offline into visual blocks when offline or no API key', async () => {
    const code = `
void setup() {
  pinMode(13, OUTPUT);
}
void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
`
    const res = await transpileSketchWithAi({
      code,
      boardId: 'arduino_uno',
      mode: 'replace'
    })

    expect(res.success).toBe(true)
    expect(res.blocks.length).toBeGreaterThan(0)
    expect(res.explanation).toBeTruthy()
  })
})
