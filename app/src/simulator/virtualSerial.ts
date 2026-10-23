/**
 * VirtualSerial — Simulated Serial Stream for Virtual Microcontroller
 * Manages timestamped serial outputs, ring-buffer persistence, and UI notification events.
 */

import type { SerialEntry, SimulationEventListener } from './types'

export class VirtualSerial {
  private entries: SerialEntry[] = []
  private maxEntries = 1000
  private entryCounter = 0
  private listeners: SimulationEventListener[] = []
  private pendingLineBuffer = ''

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries
  }

  public subscribe(listener: SimulationEventListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify(entry: SerialEntry): void {
    for (const listener of this.listeners) {
      listener({ type: 'serial_output', entry })
    }
  }

  /**
   * Appends text to the virtual serial stream.
   * If newline is false, it accumulates in pendingLineBuffer until a newline is triggered.
   */
  public print(content: string | number | boolean, virtualTimeMs: number, newline = false): void {
    const text = String(content)
    this.pendingLineBuffer += text

    if (newline) {
      const entry: SerialEntry = {
        id: `vser_${++this.entryCounter}`,
        text: this.pendingLineBuffer,
        virtualTimeMs,
        newline: true
      }
      this.entries.push(entry)
      if (this.entries.length > this.maxEntries) {
        this.entries.shift()
      }
      this.pendingLineBuffer = ''
      this.notify(entry)
    }
  }

  public println(content: string | number | boolean, virtualTimeMs: number): void {
    this.print(content, virtualTimeMs, true)
  }

  /**
   * Flushes any partial line remaining in the buffer.
   */
  public flush(virtualTimeMs: number): void {
    if (this.pendingLineBuffer.length > 0) {
      const entry: SerialEntry = {
        id: `vser_${++this.entryCounter}`,
        text: this.pendingLineBuffer,
        virtualTimeMs,
        newline: false
      }
      this.entries.push(entry)
      if (this.entries.length > this.maxEntries) {
        this.entries.shift()
      }
      this.pendingLineBuffer = ''
      this.notify(entry)
    }
  }

  public getEntries(): readonly SerialEntry[] {
    return this.entries
  }

  public clear(): void {
    this.entries = []
    this.pendingLineBuffer = ''
  }
}
