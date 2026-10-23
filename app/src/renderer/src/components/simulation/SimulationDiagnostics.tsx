/**
 * SimulationDiagnostics — Virtual Hardware Warnings & Error Log
 * Section 9: Displays unsupported block notifications, pin invalidations,
 * and execution safety alerts.
 */

import React from 'react'
import type { SimulationDiagnostic } from '@simulator'

interface SimulationDiagnosticsProps {
  diagnostics: readonly SimulationDiagnostic[]
  onClear: () => void
}

export const SimulationDiagnostics: React.FC<SimulationDiagnosticsProps> = ({
  diagnostics,
  onClear
}) => {
  const errorCount = diagnostics.filter((d) => d.severity === 'error').length
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length

  return (
    <div className="sim-diagnostics-panel">
      <div className="sim-diag-header">
        <div className="sim-diag-title-group">
          <span className="sim-pane-title">SIMULATION DIAGNOSTICS</span>
          <div className="sim-diag-counts">
            <span className={`sim-diag-badge ${errorCount > 0 ? 'badge-error' : 'badge-zero'}`}>
              {errorCount} ERRORS
            </span>
            <span className={`sim-diag-badge ${warningCount > 0 ? 'badge-warning' : 'badge-zero'}`}>
              {warningCount} WARNINGS
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sim-btn-xs"
          onClick={onClear}
          disabled={diagnostics.length === 0}
          title="Clear diagnostics list"
        >
          Clear
        </button>
      </div>

      <div className="sim-diag-list">
        {diagnostics.length === 0 ? (
          <div className="sim-diag-empty">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>No simulation diagnostics or pin conflicts reported. Hardware verified.</span>
          </div>
        ) : (
          diagnostics.map((diag, idx) => (
            <div key={`${diag.message}_${idx}`} className={`sim-diag-item item-${diag.severity}`}>
              <div className="sim-diag-icon">
                {diag.severity === 'error' ? '✕' : diag.severity === 'warning' ? '⚠' : 'ℹ'}
              </div>
              <div className="sim-diag-content">
                <div className="sim-diag-msg">{diag.message}</div>
                {(diag.pin || diag.blockId) && (
                  <div className="sim-diag-meta">
                    {diag.pin && <span className="meta-tag">Pin: {diag.pin}</span>}
                    {diag.blockId && <span className="meta-tag">Block ID: {diag.blockId}</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
