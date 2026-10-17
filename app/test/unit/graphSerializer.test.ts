import { describe, it, expect, beforeEach } from 'vitest'
import * as Blockly from 'blockly'
import { registerHardwareBlocks } from '../../src/core/blocks'
import { serializeWorkspace, loadWorkspace } from '../../src/core/graph/graphSerializer'
import type { HephaProject } from '../../src/shared/types'

describe('Project Serialization & Deserialization (graphSerializer)', () => {
  beforeEach(() => {
    registerHardwareBlocks()
  })

  it('serializes an empty workspace with correct metadata structure', () => {
    const workspace = new Blockly.Workspace()
    const serialized = serializeWorkspace(workspace as unknown as Blockly.WorkspaceSvg)

    expect(serialized).toBeDefined()
    expect(serialized.version).toBe('0.2')
    expect(serialized.blockCount).toBe(0)
    expect(serialized.state).toBeDefined()
    expect(typeof serialized.timestamp).toBe('string')
  })

  it('serializes and restores a workspace containing hardware blocks', () => {
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('pin_digital_write')
    block.setFieldValue('13', 'PIN')
    block.setFieldValue('HIGH', 'STATE')
    block.initSvg = () => {}

    const serialized = serializeWorkspace(workspace as unknown as Blockly.WorkspaceSvg)
    expect(serialized.blockCount).toBe(1)

    // Restore into a new workspace
    const newWorkspace = new Blockly.Workspace()
    loadWorkspace(newWorkspace as unknown as Blockly.WorkspaceSvg, serialized)

    expect(newWorkspace.getAllBlocks(false).length).toBe(1)
    const loadedBlock = newWorkspace.getAllBlocks(false)[0]
    expect(loadedBlock.type).toBe('pin_digital_write')
    expect(loadedBlock.getFieldValue('PIN')).toBe('13')
    expect(loadedBlock.getFieldValue('STATE')).toBe('HIGH')
  })

  it('conforms to HephaProject schema and supports legacy format compatibility', () => {
    const workspace = new Blockly.Workspace()
    const serialized = serializeWorkspace(workspace as unknown as Blockly.WorkspaceSvg)

    const project: HephaProject = {
      formatVersion: '1.0',
      name: 'Smart_Sensor_Node',
      description: 'Production IoT sensor station',
      boardId: 'esp32',
      baudRate: 115200,
      workspace: serialized.state,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const jsonString = JSON.stringify(project)
    const parsed = JSON.parse(jsonString) as HephaProject

    expect(parsed.formatVersion).toBe('1.0')
    expect(parsed.name).toBe('Smart_Sensor_Node')
    expect(parsed.boardId).toBe('esp32')
    expect(parsed.baudRate).toBe(115200)
    expect(parsed.workspace).toBeDefined()
  })

  it('gracefully handles empty or null state during loadWorkspace', () => {
    const workspace = new Blockly.Workspace()
    // Should not throw
    expect(() => {
      loadWorkspace(
        workspace as unknown as Blockly.WorkspaceSvg,
        null as unknown as Record<string, unknown>
      )
    }).not.toThrow()
  })
})
