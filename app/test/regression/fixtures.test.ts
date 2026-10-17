import { describe, it, expect, beforeAll } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import * as Blockly from 'blockly'
import { registerHardwareBlocks } from '../../src/core/blocks'
import { loadWorkspace } from '../../src/core/graph/graphSerializer'
import { arduinoGenerator } from '../../src/core/compiler'
import { parseCppToBlocks } from '../../src/core/parser/cppParser'
import type { HephaProject } from '../../src/shared/types'

describe('End-to-End Regression Fixtures Suite', () => {
  beforeAll(() => {
    registerHardwareBlocks()
  })

  const fixtures = [
    {
      dir: '01_blink_fade',
      ino: 'blink_fade.ino',
      hepha: 'blink_fade.hepha',
      name: 'Blink & Fade'
    },
    {
      dir: '02_obstacle_avoidance',
      ino: 'obstacle_avoidance.ino',
      hepha: 'obstacle_avoidance.hepha',
      name: 'Smart Obstacle Avoidance'
    },
    {
      dir: '03_weather_station',
      ino: 'weather_station.ino',
      hepha: 'weather_station.hepha',
      name: 'Weather Station'
    },
    {
      dir: '04_neopixel_mood',
      ino: 'neopixel_mood.ino',
      hepha: 'neopixel_mood.hepha',
      name: 'RGB Mood Lamp'
    },
    {
      dir: '05_smoke_detector',
      ino: 'smoke_detector.ino',
      hepha: 'smoke_detector.hepha',
      name: 'Gas & Smoke Detector'
    },
    {
      dir: '06_custom_raw_cpp',
      ino: 'state_machine.ino',
      hepha: 'state_machine.hepha',
      name: 'Custom State Machine'
    }
  ]

  for (const f of fixtures) {
    it(`loads and generates code for fixture: ${f.name} (${f.dir})`, async () => {
      const fixtureDir = join(__dirname, '../fixtures', f.dir)
      const hephaRaw = await fs.readFile(join(fixtureDir, f.hepha), 'utf-8')
      const project = JSON.parse(hephaRaw) as HephaProject

      expect(project.formatVersion).toBe('1.0')
      expect(project.workspace).toBeDefined()

      const workspace = new Blockly.Workspace()
      loadWorkspace(workspace as unknown as Blockly.WorkspaceSvg, {
        version: '1.0',
        timestamp: new Date().toISOString(),
        blockCount: 0,
        state: project.workspace
      })

      const blocks = workspace.getAllBlocks(false)
      expect(blocks.length).toBeGreaterThan(0)

      const generatedCpp = arduinoGenerator.workspaceToCode(workspace, project.baudRate)
      expect(generatedCpp).toContain('// Hepha — Generated Sketch')
      expect(generatedCpp).toContain('void setup()')
      expect(generatedCpp).toContain('void loop()')
    })

    it(`parses Arduino C++ sketch fixture into blocks: ${f.name} (${f.dir})`, async () => {
      const fixtureDir = join(__dirname, '../fixtures', f.dir)
      const inoContent = await fs.readFile(join(fixtureDir, f.ino), 'utf-8')

      const result = parseCppToBlocks(inoContent)
      expect(result.success).toBe(true)
      expect(result.blocks.length).toBeGreaterThan(0)
    })
  }
})
