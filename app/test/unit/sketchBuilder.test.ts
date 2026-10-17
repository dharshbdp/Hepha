import { describe, it, expect } from 'vitest'
import { promises as fs } from 'fs'
import { prepareSketch } from '../../src/main/compiler/sketchBuilder'

describe('Compiler Sketch Builder (sketchBuilder)', () => {
  it('creates an Arduino-CLI compliant sketch directory and matching .ino file', async () => {
    const testCode =
      'void setup() { pinMode(13, OUTPUT); }\nvoid loop() { digitalWrite(13, HIGH); }'
    const prepared = await prepareSketch(testCode, 'test_sketch')

    expect(prepared.sketchDir).toContain('hepha_builds')
    expect(prepared.sketchDir).toContain('test_sketch')
    expect(prepared.sketchPath.endsWith('test_sketch.ino')).toBe(true)

    // Verify file exists on disk and content matches
    const fileContent = await fs.readFile(prepared.sketchPath, 'utf-8')
    expect(fileContent).toBe(testCode)

    // Verify cleanup removes the temporary directory
    await prepared.cleanup()

    await expect(fs.access(prepared.sketchDir)).rejects.toThrow()
  })

  it('uses default hepha_sketch name when no custom sketch name is passed', async () => {
    const testCode = 'void setup() {}\nvoid loop() {}'
    const prepared = await prepareSketch(testCode)

    expect(prepared.sketchPath.endsWith('hepha_sketch.ino')).toBe(true)
    await prepared.cleanup()
  })
})
