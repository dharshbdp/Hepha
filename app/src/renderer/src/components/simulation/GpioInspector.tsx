/**
 * GpioInspector — Live Virtual Board Pin Inspector
 * Section 7: Displays real-time pin modes, digital states, analog ADC levels,
 * and PWM duty cycles without relying on color alone.
 */

import React from 'react'
import type { VirtualPin } from '@simulator'
import type { VirtualBoard } from '@simulator'

interface GpioInspectorProps {
  board: VirtualBoard
  pins: VirtualPin[]
}

export const GpioInspector: React.FC<GpioInspectorProps> = ({ board, pins }) => {
  const digitalPins = pins.filter((p) => !p.id.startsWith('A'))
  const analogPins = pins.filter((p) => p.id.startsWith('A'))

  return (
    <div className="sim-gpio-inspector">
      <div className="sim-inspector-header">
        <div className="sim-pane-title">LIVE GPIO REGISTER INSPECTOR</div>
        <span className="sim-board-badge">{board.capabilities.name}</span>
      </div>

      <div className="sim-gpio-tables-container">
        {/* Digital Header & Table */}
        <div className="sim-table-section">
          <div className="sim-section-label">DIGITAL PINS (D0 - D13)</div>
          <table className="sim-gpio-table">
            <thead>
              <tr>
                <th scope="col">PIN</th>
                <th scope="col">MODE</th>
                <th scope="col">STATE</th>
                <th scope="col">PWM / LEVEL</th>
                <th scope="col">CAPABILITY</th>
              </tr>
            </thead>
            <tbody>
              {digitalPins.map((pin) => {
                const isHigh = pin.digitalValue === 1
                const isPwm = pin.isPwmCapable && pin.mode === 'OUTPUT' && pin.pwmValue > 0

                return (
                  <tr key={pin.id} className={`pin-row ${pin.mode.toLowerCase()}`}>
                    <td className="pin-id">
                      <strong>D{pin.id}</strong>
                    </td>
                    <td>
                      <span className={`sim-mode-tag mode-${pin.mode.toLowerCase()}`}>
                        {pin.mode}
                      </span>
                    </td>
                    <td>
                      <span className={`sim-state-tag ${isHigh ? 'state-high' : 'state-low'}`}>
                        <span className="state-icon">{isHigh ? '▲' : '▼'}</span>
                        <span className="state-text">{isHigh ? 'HIGH' : 'LOW'}</span>
                      </span>
                    </td>
                    <td className="pin-pwm-col">
                      {isPwm ? (
                        <div className="sim-pwm-meter">
                          <span className="pwm-num">{pin.pwmValue}</span>
                          <div className="pwm-track">
                            <div
                              className="pwm-fill"
                              style={{ width: `${(pin.pwmValue / 255) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="sim-text-dim">{isHigh ? '5.0V' : '0.0V'}</span>
                      )}
                    </td>
                    <td className="pin-caps">
                      {pin.isPwmCapable ? (
                        <span className="sim-cap-badge" title="Hardware Timer PWM Supported">
                          ~PWM
                        </span>
                      ) : pin.id === '0' ? (
                        <span className="sim-cap-badge" title="UART RX">
                          RX
                        </span>
                      ) : pin.id === '1' ? (
                        <span className="sim-cap-badge" title="UART TX">
                          TX
                        </span>
                      ) : pin.id === '13' ? (
                        <span className="sim-cap-badge" title="Builtin LED">
                          LED
                        </span>
                      ) : (
                        <span className="sim-text-dim">GPIO</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Analog Table */}
        <div className="sim-table-section">
          <div className="sim-section-label">ANALOG ADC PINS (A0 - A5)</div>
          <table className="sim-gpio-table">
            <thead>
              <tr>
                <th scope="col">PIN</th>
                <th scope="col">MODE</th>
                <th scope="col">RAW ADC (10-BIT)</th>
                <th scope="col">VOLTAGE</th>
                <th scope="col">SPECIAL</th>
              </tr>
            </thead>
            <tbody>
              {analogPins.map((pin) => {
                const voltage = ((pin.analogValue / 1023) * board.capabilities.voltage).toFixed(2)

                return (
                  <tr key={pin.id} className="pin-row analog">
                    <td className="pin-id">
                      <strong>{pin.id}</strong>
                    </td>
                    <td>
                      <span className="sim-mode-tag mode-input">ANALOG_IN</span>
                    </td>
                    <td>
                      <div className="sim-adc-meter">
                        <span className="adc-num">{pin.analogValue}</span>
                        <div className="adc-track">
                          <div
                            className="adc-fill"
                            style={{ width: `${(pin.analogValue / 1023) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sim-voltage-tag">{voltage} V</span>
                    </td>
                    <td className="pin-caps">
                      {pin.id === 'A4' ? (
                        <span className="sim-cap-badge" title="I2C SDA">
                          SDA
                        </span>
                      ) : pin.id === 'A5' ? (
                        <span className="sim-cap-badge" title="I2C SCL">
                          SCL
                        </span>
                      ) : (
                        <span className="sim-text-dim">ADC</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
