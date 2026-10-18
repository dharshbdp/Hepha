import { describe, it, expect } from 'vitest'
import { parseTelemetryLine } from '../../src/renderer/src/utils/telemetryParser'

describe('Telemetry Stream Parser (telemetryParser)', () => {
  it('parses standard JSON telemetry objects', () => {
    const line = '{"temp": 24.5, "hum": 60.2, "count": 100}'
    const result = parseTelemetryLine(line)
    expect(result).toEqual({
      temp: 24.5,
      hum: 60.2,
      count: 100
    })
  })

  it('parses colon-separated key-value telemetry pairs', () => {
    const line = 'temp: 24.5, hum: 60'
    const result = parseTelemetryLine(line)
    expect(result).toEqual({
      temp: 24.5,
      hum: 60
    })
  })

  it('parses sensor labels with hyphens and spaces in key-value format', () => {
    const line = 'MQ-2 Gas Level: 382.5'
    const result = parseTelemetryLine(line)
    expect(result).toEqual({
      'MQ-2 Gas Level': 382.5
    })
  })

  it('parses equals-separated telemetry pairs', () => {
    const line = 'volts=3.28;amps=0.45'
    const result = parseTelemetryLine(line)
    expect(result).toEqual({
      volts: 3.28,
      amps: 0.45
    })
  })

  it('parses negative float values correctly', () => {
    const line = 'delta_x: -15.8, delta_y: -0.25'
    const result = parseTelemetryLine(line)
    expect(result).toEqual({
      delta_x: -15.8,
      delta_y: -0.25
    })
  })

  it('parses Arduino Serial Plotter CSV numbers into numbered channels', () => {
    const line = '1023, 512, 256'
    const result = parseTelemetryLine(line)
    expect(result).toEqual({
      channel_1: 1023,
      channel_2: 512,
      channel_3: 256
    })
  })

  it('parses tab-separated serial plotter values', () => {
    const line = '100\t200\t300'
    const result = parseTelemetryLine(line)
    expect(result).toEqual({
      channel_1: 100,
      channel_2: 200,
      channel_3: 300
    })
  })

  it('gracefully returns null for empty, whitespace, or non-numerical log lines', () => {
    expect(parseTelemetryLine('')).toBeNull()
    expect(parseTelemetryLine('   ')).toBeNull()
    expect(parseTelemetryLine('Initializing sensor peripheral...')).toBeNull()
    expect(parseTelemetryLine('System Boot Complete')).toBeNull()
    expect(parseTelemetryLine('ERROR: Sensor not responding')).toBeNull()
  })

  it('gracefully falls back when JSON is malformed', () => {
    // Malformed JSON that contains key-value structure
    const malformed = '{temp: 25.0, status: broken}'
    const result = parseTelemetryLine(malformed)
    // Key-value regex matches "temp: 25.0"
    expect(result).toEqual({
      temp: 25.0
    })
  })
})
