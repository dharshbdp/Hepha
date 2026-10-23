/**
 * VirtualClock — Deterministic Virtual Hardware Timekeeper
 * Manages simulation elapsed time independently of wall-clock drift,
 * supporting microsecond precision, delay progression, and speed scaling.
 */

export class VirtualClock {
  private elapsedMicros = 0
  private speedMultiplier = 1.0

  constructor(initialSpeed = 1.0) {
    this.speedMultiplier = Math.max(0.1, Math.min(initialSpeed, 10.0))
  }

  public getElapsedMicros(): number {
    return this.elapsedMicros
  }

  public getElapsedMillis(): number {
    return Math.floor(this.elapsedMicros / 1000)
  }

  public advanceMicros(us: number): void {
    if (us > 0) {
      this.elapsedMicros += Math.round(us)
    }
  }

  public advanceMillis(ms: number): void {
    if (ms > 0) {
      this.advanceMicros(ms * 1000)
    }
  }

  public getSpeed(): number {
    return this.speedMultiplier
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.1, Math.min(multiplier, 10.0))
  }

  public reset(): void {
    this.elapsedMicros = 0
  }

  /**
   * Formats virtual time into a human-readable HH:MM:SS.mmm format.
   */
  public formatTime(): string {
    const totalMs = this.getElapsedMillis()
    const ms = totalMs % 1000
    const totalSec = Math.floor(totalMs / 1000)
    const sec = totalSec % 60
    const totalMin = Math.floor(totalSec / 60)
    const min = totalMin % 60
    const hr = Math.floor(totalMin / 60)

    const pad = (n: number, width = 2): string => n.toString().padStart(width, '0')
    return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`
  }
}
