/**
 * VirtualSerialMonitor — Virtual Microcontroller Serial Stream
 * Section 8: Real-time virtual serial monitoring with virtual timestamps,
 * autoscroll, and strict isolation from physical hardware COM ports.
 */

import React, { useEffect, useRef, useState } from 'react'
import type { SerialEntry } from '@simulator'
import type { VirtualSerial } from '@simulator'

interface VirtualSerialMonitorProps {
  serial: VirtualSerial
  entries: readonly SerialEntry[]
  onClear: () => void
}

export const VirtualSerialMonitor: React.FC<VirtualSerialMonitorProps> = ({ entries, onClear }) => {
  const [autoScroll, setAutoScroll] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries, autoScroll])

  const formatTimestamp = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000)
    const sec = totalSec % 60
    const min = Math.floor(totalSec / 60) % 60
    const remMs = ms % 1000
    const pad = (n: number, w = 2): string => n.toString().padStart(w, '0')
    return `${pad(min)}:${pad(sec)}.${remMs.toString().padStart(3, '0')}`
  }

  const handleCopy = (): void => {
    const text = entries.map((e) => `[${formatTimestamp(e.virtualTimeMs)}] ${e.text}`).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="sim-serial-monitor">
      <div className="sim-serial-header">
        <div className="sim-serial-title-group">
          <span className="sim-pane-title">VIRTUAL SERIAL MONITOR</span>
          <span className="sim-port-tag">PORT: SIM_UART0 (115200)</span>
        </div>

        <div className="sim-serial-actions">
          <button
            type="button"
            className={`sim-btn-xs ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll((prev) => !prev)}
            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          >
            Auto-scroll
          </button>
          <button
            type="button"
            className="sim-btn-xs"
            onClick={handleCopy}
            disabled={entries.length === 0}
            title="Copy serial output to clipboard"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className="sim-btn-xs"
            onClick={onClear}
            disabled={entries.length === 0}
            title="Clear virtual serial monitor"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="sim-serial-body" role="log" aria-live="polite">
        {entries.length === 0 ? (
          <div className="sim-serial-empty">
            <span>Virtual serial buffer ready. Serial prints will appear here.</span>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="sim-serial-line">
              <span className="sim-serial-ts">[{formatTimestamp(entry.virtualTimeMs)}]</span>
              <span className="sim-serial-text">{entry.text}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
