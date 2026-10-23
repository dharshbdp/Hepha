/**
 * SimulationToolbar — Execution Controls, Virtual Clock, Speed, and Demos
 */

import React from 'react'
import type { SimulationStatus } from '@simulator'
import { DEMO_PROJECTS, type SimulationDemoProject } from '@simulator'

interface SimulationToolbarProps {
  status: SimulationStatus
  virtualTimeFormatted: string
  speedMultiplier: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStep: () => void
  onReset: () => void
  onStop: () => void
  onSpeedChange: (speed: number) => void
  onLoadDemo: (demo: SimulationDemoProject) => void
  onAddComponentClick: () => void
  isWorkspaceEmpty: boolean
}

const SPEED_OPTIONS = [0.25, 0.5, 1.0, 2.0, 4.0]

export const SimulationToolbar: React.FC<SimulationToolbarProps> = ({
  status,
  virtualTimeFormatted,
  speedMultiplier,
  onStart,
  onPause,
  onResume,
  onStep,
  onReset,
  onStop,
  onSpeedChange,
  onLoadDemo,
  onAddComponentClick,
  isWorkspaceEmpty
}) => {
  return (
    <div className="sim-toolbar" role="toolbar" aria-label="Simulation Execution Controls">
      {/* Left: Execution Action Buttons */}
      <div className="sim-action-group">
        {status === 'running' ? (
          <button
            type="button"
            className="sim-btn sim-btn-pause"
            onClick={onPause}
            title="Pause virtual simulation"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            <span>Pause</span>
          </button>
        ) : status === 'paused' ? (
          <button
            type="button"
            className="sim-btn sim-btn-primary sim-btn-resume"
            onClick={onResume}
            title="Resume virtual simulation"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Resume</span>
          </button>
        ) : (
          <button
            type="button"
            className="sim-btn sim-btn-primary sim-btn-run"
            onClick={onStart}
            disabled={isWorkspaceEmpty}
            title={
              isWorkspaceEmpty
                ? 'Visual logic canvas is empty. Add blocks or load a template.'
                : 'Run virtual simulation'
            }
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Run</span>
          </button>
        )}

        {/* Step Button */}
        <button
          type="button"
          className="sim-btn sim-btn-step"
          onClick={onStep}
          disabled={isWorkspaceEmpty || status === 'running'}
          title="Step forward 1 instruction"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
            <line x1="19" y1="5" x2="19" y2="19" strokeWidth="2" />
          </svg>
          <span>Step</span>
        </button>

        {/* Stop Button */}
        <button
          type="button"
          className="sim-btn sim-btn-stop"
          onClick={onStop}
          disabled={status === 'idle' || status === 'stopped'}
          title="Stop simulation execution"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="1" />
          </svg>
          <span>Stop</span>
        </button>

        {/* Reset Button */}
        <button
          type="button"
          className="sim-btn sim-btn-reset"
          onClick={onReset}
          title="Reset simulation time and hardware pin states"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Reset</span>
        </button>
      </div>

      {/* Center: Status Badge & Virtual Clock */}
      <div className="sim-center-meta">
        <div className={`sim-status-pill status-${status}`}>
          <span className="sim-status-dot" aria-hidden="true" />
          <span className="sim-status-label">{status.toUpperCase()}</span>
        </div>

        <div
          className="sim-clock-display"
          title="Virtual Hardware Clock (Independent of wall-clock jitter)"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="sim-clock-time">{virtualTimeFormatted}</span>
        </div>

        {/* Speed Multiplier Dropdown */}
        <div className="sim-speed-picker">
          <label htmlFor="sim-speed-select">SPEED</label>
          <select
            id="sim-speed-select"
            value={speedMultiplier}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            title="Simulation execution speed multiplier"
          >
            {SPEED_OPTIONS.map((spd) => (
              <option key={spd} value={spd}>
                {spd}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Demo Projects & Add Component Actions */}
      <div className="sim-right-actions">
        {/* Load Demo Template */}
        <div className="sim-demo-picker">
          <label htmlFor="sim-demo-select">DEMO</label>
          <select
            id="sim-demo-select"
            defaultValue=""
            onChange={(e) => {
              const demo = DEMO_PROJECTS.find((d) => d.id === e.target.value)
              if (demo) onLoadDemo(demo)
              e.target.value = ''
            }}
            title="Load demonstration project"
          >
            <option value="" disabled>
              Load Demo Circuit...
            </option>
            {DEMO_PROJECTS.map((demo) => (
              <option key={demo.id} value={demo.id}>
                {demo.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Component Button */}
        <button
          type="button"
          className="sim-btn sim-btn-add-comp"
          onClick={onAddComponentClick}
          title="Add virtual component to workbench"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Component</span>
        </button>
      </div>
    </div>
  )
}
