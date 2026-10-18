import { describe, it, expect, beforeAll } from 'vitest'
import * as Blockly from 'blockly'
import { registerHardwareBlocks } from '../../src/core/blocks'
import { loadWorkspace } from '../../src/core/graph/graphSerializer'
import { arduinoGenerator, micropythonGenerator } from '../../src/core/compiler'
import { diagnoseCircuit } from '../../src/core/validation'
import { STARTER_PROJECTS } from '../../src/renderer/src/data/starterProjects'

describe('Starter Projects Library (starterProjects)', () => {
  beforeAll(() => {
    registerHardwareBlocks()
  })

  it('contains at least 5 curated starter projects with valid metadata', () => {
    expect(STARTER_PROJECTS.length).toBeGreaterThanOrEqual(5)

    for (const starter of STARTER_PROJECTS) {
      expect(starter.id).toBeTruthy()
      expect(starter.name).toBeTruthy()
      expect(starter.description).toBeTruthy()
      expect(['Beginner', 'Intermediate']).toContain(starter.difficulty)
      expect(starter.boardId).toBeTruthy()
      expect(starter.baudRate).toBeGreaterThan(0)
      expect(starter.project.formatVersion).toBe('1.0')
      expect(starter.project.workspace).toBeDefined()
    }
  })

  for (const starter of STARTER_PROJECTS) {
    it(`loads and generates valid Arduino & MicroPython for starter: ${starter.name} (${starter.id})`, () => {
      const workspace = new Blockly.Workspace()
      loadWorkspace(workspace as unknown as Blockly.WorkspaceSvg, {
        version: '1.0',
        timestamp: starter.project.updatedAt,
        blockCount: 0,
        state: starter.project.workspace
      })

      const blocks = workspace.getAllBlocks(false)
      expect(blocks.length).toBeGreaterThan(0)

      // Arduino C++ generation
      const cpp = arduinoGenerator.workspaceToCode(workspace, starter.baudRate)
      expect(cpp).toContain('// Hepha — Generated Sketch')
      expect(cpp).toContain('void setup()')
      expect(cpp).toContain('void loop()')

      // MicroPython generation
      const py = micropythonGenerator.workspaceToCode(workspace)
      expect(py).toContain('# Hepha — Generated MicroPython')
      expect(py).toContain('while True:')

      // Static circuit diagnostics
      const diag = diagnoseCircuit(workspace as unknown as Blockly.WorkspaceSvg, starter.boardId)
      expect(diag).toBeDefined()
      expect(typeof diag.isValid).toBe('boolean')
    })
  }
})
