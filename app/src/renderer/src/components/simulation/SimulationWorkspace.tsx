/**
 * SimulationWorkspace — Main Simulation Environment Workspace
 * Assembles Toolbar, Interactive Component Workbench, Live GPIO Inspector,
 * Virtual Serial Monitor, and Diagnostics into a cohesive desktop workspace.
 */

import React, { useState, useEffect, useCallback } from 'react'
import * as Blockly from 'blockly'
import {
  SimulationEngine,
  DEMO_PROJECT_BLINK,
  type SimulationStatus,
  type VirtualComponentConfig,
  type VirtualPin,
  type SerialEntry,
  type SimulationDiagnostic,
  type SimulationDemoProject,
  type VirtualCircuitConfig
} from '@simulator'
import { SimulationToolbar } from './SimulationToolbar'
import { ComponentWorkbench } from './ComponentWorkbench'
import { GpioInspector } from './GpioInspector'
import { VirtualSerialMonitor } from './VirtualSerialMonitor'
import { SimulationDiagnostics } from './SimulationDiagnostics'

interface SimulationWorkspaceProps {
  workspaceRef: React.RefObject<Blockly.WorkspaceSvg | null>
  blockCount: number
  boardId: string
  circuitConfig?: VirtualCircuitConfig
  onCircuitConfigChange?: (config: VirtualCircuitConfig) => void
  onLoadWorkspaceState?: (state: Record<string, unknown>) => void
}

export const SimulationWorkspace: React.FC<SimulationWorkspaceProps> = ({
  workspaceRef,
  blockCount,
  boardId,
  circuitConfig,
  onCircuitConfigChange,
  onLoadWorkspaceState
}) => {
  const [components, setComponents] = useState<VirtualComponentConfig[]>(() => {
    if (circuitConfig?.components && circuitConfig.components.length > 0) {
      return circuitConfig.components as VirtualComponentConfig[]
    }
    // Default initial component is D13 LED
    return [...DEMO_PROJECT_BLINK.circuitConfig.components]
  })

  const [engine] = useState(() => {
    const eng = new SimulationEngine(boardId)
    const initialComps =
      circuitConfig?.components && circuitConfig.components.length > 0
        ? (circuitConfig.components as VirtualComponentConfig[])
        : [...DEMO_PROJECT_BLINK.circuitConfig.components]
    eng.loadCircuitConfig({
      boardId,
      components: initialComps
    })
    return eng
  })

  // State hooks
  const [status, setStatus] = useState<SimulationStatus>(engine.getStatus())
  const [virtualTime, setVirtualTime] = useState<string>('00:00:00.000')
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(engine.getSpeed())
  const [pins, setPins] = useState<VirtualPin[]>(engine.board.getAllPins())
  const [serialEntries, setSerialEntries] = useState<readonly SerialEntry[]>([])
  const [diagnostics, setDiagnostics] = useState<SimulationDiagnostic[]>([])
  const [activeInspectorTab, setActiveInspectorTab] = useState<'gpio' | 'serial' | 'diag'>('gpio')
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)

  // Subscribe to engine events
  useEffect(() => {
    const unsubscribe = engine.subscribe((event) => {
      switch (event.type) {
        case 'status_change':
          setStatus(event.status)
          break

        case 'time_tick':
          setVirtualTime(engine.clock.formatTime())
          break

        case 'gpio_change':
          setPins(engine.board.getAllPins())
          break

        case 'serial_output':
          setSerialEntries([...engine.serial.getEntries()])
          break

        case 'diagnostic':
          setDiagnostics((prev) => [...prev, event.diagnostic])
          break

        case 'step_done':
          setPins(engine.board.getAllPins())
          setVirtualTime(engine.clock.formatTime())
          break

        case 'component_change':
          // Force re-render of component states
          setPins(engine.board.getAllPins())
          break
      }
    })

    return () => {
      unsubscribe()
      engine.stop()
    }
  }, [engine])

  // Sync workspace blocks into engine on start or compile
  const syncWorkspaceToEngine = useCallback((): boolean => {
    const ws = workspaceRef.current
    if (!ws) return false
    const program = engine.loadProgram(ws, boardId)
    setDiagnostics([...program.diagnostics])
    setPins(engine.board.getAllPins())
    return program.loop.length > 0 || program.setup.length > 0
  }, [engine, workspaceRef, boardId])

  const handleStart = (): void => {
    const hasBlocks = syncWorkspaceToEngine()
    if (!hasBlocks) return
    engine.start()
  }

  const handlePause = (): void => {
    engine.pause()
  }

  const handleResume = (): void => {
    engine.resume()
  }

  const handleStep = (): void => {
    if (status === 'idle' || status === 'stopped') {
      syncWorkspaceToEngine()
    }
    engine.step()
  }

  const handleReset = (): void => {
    engine.reset(false)
    setStatus('idle')
    setVirtualTime('00:00:00.000')
    setPins(engine.board.getAllPins())
    setSerialEntries([])
  }

  const handleStop = (): void => {
    engine.stop()
    setStatus('stopped')
  }

  const handleSpeedChange = (speed: number): void => {
    setSpeedMultiplier(speed)
    engine.setSpeed(speed)
  }

  const handleAddComponent = (type: VirtualComponentConfig['type']): void => {
    const count = components.filter((c) => c.type === type).length + 1
    let newComp: VirtualComponentConfig

    switch (type) {
      case 'led':
        newComp = {
          id: `led_${Date.now()}`,
          type: 'led',
          name: `LED ${count}`,
          pin: '13',
          color: '#22c55e'
        }
        break
      case 'button':
        newComp = {
          id: `btn_${Date.now()}`,
          type: 'button',
          name: `Button ${count}`,
          pin: '2',
          activeLow: true
        }
        break
      case 'potentiometer':
        newComp = {
          id: `pot_${Date.now()}`,
          type: 'potentiometer',
          name: `Potentiometer ${count}`,
          pin: 'A0',
          currentValue: 512
        }
        break
      case 'ultrasonic':
        newComp = {
          id: `us_${Date.now()}`,
          type: 'ultrasonic',
          name: `Ultrasonic Sensor`,
          trigPin: '9',
          echoPin: '10',
          distanceCm: 50
        }
        break
      case 'digital_sensor':
        newComp = {
          id: `ds_${Date.now()}`,
          type: 'digital_sensor',
          name: `Digital Sensor ${count}`,
          pin: '4',
          activeHigh: true
        }
        break
      case 'analog_sensor':
        newComp = {
          id: `as_${Date.now()}`,
          type: 'analog_sensor',
          name: `Analog Sensor ${count}`,
          pin: 'A1',
          currentValue: 300
        }
        break
    }

    const updated = [...components, newComp]
    setComponents(updated)
    engine.components.addComponent(newComp)
    setPins(engine.board.getAllPins())

    onCircuitConfigChange?.({
      boardId,
      components: updated
    })
  }

  const handleUpdateComponent = (updatedComp: VirtualComponentConfig): void => {
    const updated = components.map((c) => (c.id === updatedComp.id ? updatedComp : c))
    setComponents(updated)
    engine.components.addComponent(updatedComp)
    setPins(engine.board.getAllPins())

    onCircuitConfigChange?.({
      boardId,
      components: updated
    })
  }

  const handleRemoveComponent = (id: string): void => {
    const updated = components.filter((c) => c.id !== id)
    setComponents(updated)
    engine.components.removeComponent(id)
    setPins(engine.board.getAllPins())

    onCircuitConfigChange?.({
      boardId,
      components: updated
    })
  }

  const handleLoadDemo = (demo: SimulationDemoProject): void => {
    engine.stop()
    // Load workspace blocks into active Blockly workspace
    if (onLoadWorkspaceState && demo.workspace) {
      onLoadWorkspaceState(demo.workspace)
    }

    // Load components
    setComponents([...demo.circuitConfig.components])
    engine.loadCircuitConfig(demo.circuitConfig)
    setPins(engine.board.getAllPins())
    setSerialEntries([])
    setDiagnostics([])

    // Load program into engine
    const prog = engine.loadProgram(demo.workspace, demo.boardId)
    setDiagnostics([...prog.diagnostics])

    onCircuitConfigChange?.({
      boardId: demo.boardId,
      components: demo.circuitConfig.components
    })
  }

  const isWorkspaceEmpty = blockCount === 0

  return (
    <div className="sim-workspace-root">
      {/* Simulation Execution Toolbar */}
      <SimulationToolbar
        status={status}
        virtualTimeFormatted={virtualTime}
        speedMultiplier={speedMultiplier}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStep={handleStep}
        onReset={handleReset}
        onStop={handleStop}
        onSpeedChange={handleSpeedChange}
        onLoadDemo={handleLoadDemo}
        onAddComponentClick={() => setIsAddModalOpen(true)}
        isWorkspaceEmpty={isWorkspaceEmpty}
      />

      {/* Main Simulation Viewport: Dual Column Layout */}
      <div className="sim-main-viewport">
        {/* Left Column: Interactive Component Workbench */}
        <section className="sim-left-pane">
          <ComponentWorkbench
            engine={engine}
            components={components}
            onUpdateComponent={handleUpdateComponent}
            onRemoveComponent={handleRemoveComponent}
            onAddComponent={handleAddComponent}
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={setIsAddModalOpen}
          />
        </section>

        {/* Right Column: Tabbed Inspector (GPIO, Serial Monitor, Diagnostics) */}
        <section className="sim-right-pane">
          {/* Tab Switcher */}
          <div className="sim-inspector-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeInspectorTab === 'gpio'}
              className={`sim-tab-btn ${activeInspectorTab === 'gpio' ? 'active' : ''}`}
              onClick={() => setActiveInspectorTab('gpio')}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="2" width="20" height="20" rx="3" />
                <path d="M7 2v4M12 2v4M17 2v4M7 18v4M12 18v4M17 18v4M2 7h4M2 12h4M2 17h4M18 7h4M18 12h4M18 17h4" />
              </svg>
              <span>GPIO Registers</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeInspectorTab === 'serial'}
              className={`sim-tab-btn ${activeInspectorTab === 'serial' ? 'active' : ''}`}
              onClick={() => setActiveInspectorTab('serial')}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              <span>Serial Monitor</span>
              {serialEntries.length > 0 && (
                <span className="sim-tab-badge">{serialEntries.length}</span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeInspectorTab === 'diag'}
              className={`sim-tab-btn ${activeInspectorTab === 'diag' ? 'active' : ''}`}
              onClick={() => setActiveInspectorTab('diag')}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Diagnostics</span>
              {diagnostics.length > 0 && (
                <span className="sim-tab-badge">{diagnostics.length}</span>
              )}
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="sim-tab-content">
            {activeInspectorTab === 'gpio' && <GpioInspector board={engine.board} pins={pins} />}
            {activeInspectorTab === 'serial' && (
              <VirtualSerialMonitor
                serial={engine.serial}
                entries={serialEntries}
                onClear={() => {
                  engine.serial.clear()
                  setSerialEntries([])
                }}
              />
            )}
            {activeInspectorTab === 'diag' && (
              <SimulationDiagnostics diagnostics={diagnostics} onClear={() => setDiagnostics([])} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
