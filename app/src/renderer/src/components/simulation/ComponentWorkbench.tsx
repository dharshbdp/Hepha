/**
 * ComponentWorkbench — Virtual Hardware Scene & Interactive Peripherals
 * Renders real stateful component models (LED, Button, Potentiometer,
 * Digital Sensor, Analog Sensor, Ultrasonic Sensor) on a virtual breadboard.
 */

import React from 'react'
import type {
  VirtualComponentConfig,
  VirtualLedConfig,
  VirtualButtonConfig,
  VirtualPotentiometerConfig,
  VirtualDigitalSensorConfig,
  VirtualAnalogSensorConfig,
  VirtualUltrasonicConfig
} from '@simulator'
import type { SimulationEngine } from '@simulator'

interface ComponentWorkbenchProps {
  engine: SimulationEngine
  components: VirtualComponentConfig[]
  onUpdateComponent: (updated: VirtualComponentConfig) => void
  onRemoveComponent: (id: string) => void
  onAddComponent: (type: VirtualComponentConfig['type']) => void
  isAddModalOpen: boolean
  setIsAddModalOpen: (open: boolean) => void
}

const DIGITAL_PIN_OPTIONS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13'
]

const ANALOG_PIN_OPTIONS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']

export const ComponentWorkbench: React.FC<ComponentWorkbenchProps> = ({
  engine,
  components,
  onUpdateComponent,
  onRemoveComponent,
  onAddComponent,
  isAddModalOpen,
  setIsAddModalOpen
}) => {
  return (
    <div className="sim-workbench-container">
      <div className="sim-workbench-header">
        <div className="sim-workbench-title-group">
          <span className="sim-pane-title">VIRTUAL HARDWARE WORKBENCH</span>
          <span className="sim-comp-count">{components.length} COMPONENTS</span>
        </div>
        <button
          type="button"
          className="sim-btn-sm"
          onClick={() => setIsAddModalOpen(true)}
          title="Add a new component to the virtual workbench"
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
          <span>Add</span>
        </button>
      </div>

      {/* Component Cards Grid */}
      <div className="sim-cards-grid">
        {components.length === 0 ? (
          <div className="sim-workbench-empty">
            <div className="sim-empty-icon" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h4>Workbench is Empty</h4>
            <p>
              Add virtual LEDs, buttons, potentiometers, or ultrasonic sensors to interact with your
              code.
            </p>
            <button
              type="button"
              className="sim-btn sim-btn-primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add First Component
            </button>
          </div>
        ) : (
          components.map((comp) => {
            switch (comp.type) {
              case 'led':
                return (
                  <LedCard
                    key={comp.id}
                    config={comp as VirtualLedConfig}
                    engine={engine}
                    onPinChange={(pin) => onUpdateComponent({ ...comp, pin })}
                    onRemove={() => onRemoveComponent(comp.id)}
                  />
                )

              case 'button':
                return (
                  <ButtonCard
                    key={comp.id}
                    config={comp as VirtualButtonConfig}
                    engine={engine}
                    onPinChange={(pin) => onUpdateComponent({ ...comp, pin })}
                    onRemove={() => onRemoveComponent(comp.id)}
                  />
                )

              case 'potentiometer':
                return (
                  <PotentiometerCard
                    key={comp.id}
                    config={comp as VirtualPotentiometerConfig}
                    engine={engine}
                    onPinChange={(pin) => onUpdateComponent({ ...comp, pin })}
                    onRemove={() => onRemoveComponent(comp.id)}
                  />
                )

              case 'digital_sensor':
                return (
                  <DigitalSensorCard
                    key={comp.id}
                    config={comp as VirtualDigitalSensorConfig}
                    engine={engine}
                    onPinChange={(pin) => onUpdateComponent({ ...comp, pin })}
                    onRemove={() => onRemoveComponent(comp.id)}
                  />
                )

              case 'analog_sensor':
                return (
                  <AnalogSensorCard
                    key={comp.id}
                    config={comp as VirtualAnalogSensorConfig}
                    engine={engine}
                    onPinChange={(pin) => onUpdateComponent({ ...comp, pin })}
                    onRemove={() => onRemoveComponent(comp.id)}
                  />
                )

              case 'ultrasonic':
                return (
                  <UltrasonicCard
                    key={comp.id}
                    config={comp as VirtualUltrasonicConfig}
                    engine={engine}
                    onTrigPinChange={(trigPin) => onUpdateComponent({ ...comp, trigPin })}
                    onEchoPinChange={(echoPin) => onUpdateComponent({ ...comp, echoPin })}
                    onRemove={() => onRemoveComponent(comp.id)}
                  />
                )

              default:
                return null
            }
          })
        )}
      </div>

      {/* Add Component Dialog Modal */}
      {isAddModalOpen && (
        <div className="sim-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="sim-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sim-modal-header">
              <h3>Add Virtual Component</h3>
              <button
                type="button"
                className="sim-modal-close"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="sim-modal-body">
              <div className="sim-comp-library-grid">
                <button
                  type="button"
                  className="sim-lib-btn"
                  onClick={() => {
                    onAddComponent('led')
                    setIsAddModalOpen(false)
                  }}
                >
                  <div className="sim-lib-icon sim-icon-led" />
                  <div className="sim-lib-text">
                    <strong>LED (Light Emitting Diode)</strong>
                    <span>Visual digital or PWM output indicator</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="sim-lib-btn"
                  onClick={() => {
                    onAddComponent('button')
                    setIsAddModalOpen(false)
                  }}
                >
                  <div className="sim-lib-icon sim-icon-btn" />
                  <div className="sim-lib-text">
                    <strong>Push Button</strong>
                    <span>Tactile digital input with pull-up resistor</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="sim-lib-btn"
                  onClick={() => {
                    onAddComponent('potentiometer')
                    setIsAddModalOpen(false)
                  }}
                >
                  <div className="sim-lib-icon sim-icon-pot" />
                  <div className="sim-lib-text">
                    <strong>Potentiometer</strong>
                    <span>Rotary 10-bit analog voltage divider</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="sim-lib-btn"
                  onClick={() => {
                    onAddComponent('ultrasonic')
                    setIsAddModalOpen(false)
                  }}
                >
                  <div className="sim-lib-icon sim-icon-us" />
                  <div className="sim-lib-text">
                    <strong>Ultrasonic Distance Sensor</strong>
                    <span>HC-SR04 sonar rangefinder (2 - 400cm)</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="sim-lib-btn"
                  onClick={() => {
                    onAddComponent('digital_sensor')
                    setIsAddModalOpen(false)
                  }}
                >
                  <div className="sim-lib-icon sim-icon-ds" />
                  <div className="sim-lib-text">
                    <strong>Generic Digital Sensor</strong>
                    <span>Controllable binary trigger / switch</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="sim-lib-btn"
                  onClick={() => {
                    onAddComponent('analog_sensor')
                    setIsAddModalOpen(false)
                  }}
                >
                  <div className="sim-lib-icon sim-icon-as" />
                  <div className="sim-lib-text">
                    <strong>Generic Analog Sensor</strong>
                    <span>Variable 0-1023 voltage source (LDR/MQ2)</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------------------
// Component Card Renderers
// -------------------------------------------------------------------------

interface LedCardProps {
  config: VirtualLedConfig
  engine: SimulationEngine
  onPinChange: (pin: string) => void
  onRemove: () => void
}

const LedCard: React.FC<LedCardProps> = ({ config, engine, onPinChange, onRemove }) => {
  const ledState = engine.components.getLedState(config.id)
  const pinObj = engine.board.getPin(config.pin)
  const isPwm = pinObj?.pwmValue !== undefined && pinObj.pwmValue > 0 && pinObj.pwmValue < 255

  return (
    <div className={`sim-card sim-card-led ${ledState.isOn ? 'active' : ''}`}>
      <div className="sim-card-header">
        <div className="sim-card-badge">LED</div>
        <div className="sim-card-title">{config.name}</div>
        <button type="button" className="sim-card-remove" onClick={onRemove} title="Remove LED">
          &times;
        </button>
      </div>

      <div className="sim-card-body">
        {/* Visual LED Graphic */}
        <div className="sim-led-visual">
          <div
            className={`sim-led-bulb ${ledState.isOn ? 'on' : 'off'}`}
            style={{
              opacity: ledState.isOn ? (isPwm ? Math.max(0.2, ledState.brightness / 100) : 1) : 0.2
            }}
          >
            <div className="sim-led-glare" />
          </div>
          <div className="sim-led-state-label">
            {ledState.isOn ? (isPwm ? `PWM ${ledState.brightness}%` : 'HIGH (ON)') : 'LOW (OFF)'}
          </div>
        </div>

        {/* Pin Connection Selector */}
        <div className="sim-card-control">
          <label htmlFor={`pin-select-${config.id}`}>Pin</label>
          <select
            id={`pin-select-${config.id}`}
            value={config.pin}
            onChange={(e) => onPinChange(e.target.value)}
          >
            {DIGITAL_PIN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                D{p}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

interface ButtonCardProps {
  config: VirtualButtonConfig
  engine: SimulationEngine
  onPinChange: (pin: string) => void
  onRemove: () => void
}

const ButtonCard: React.FC<ButtonCardProps> = ({ config, engine, onPinChange, onRemove }) => {
  const isPressed = engine.components.isButtonPressed(config.id)

  const handleToggle = (): void => {
    engine.components.setButtonPressed(config.id, !isPressed)
  }

  const handleMouseDown = (): void => {
    engine.components.setButtonPressed(config.id, true)
  }

  const handleMouseUp = (): void => {
    engine.components.setButtonPressed(config.id, false)
  }

  return (
    <div className={`sim-card sim-card-btn ${isPressed ? 'pressed' : ''}`}>
      <div className="sim-card-header">
        <div className="sim-card-badge">BUTTON</div>
        <div className="sim-card-title">{config.name}</div>
        <button type="button" className="sim-card-remove" onClick={onRemove} title="Remove Button">
          &times;
        </button>
      </div>

      <div className="sim-card-body">
        <div className="sim-btn-container">
          <button
            type="button"
            className={`sim-push-button ${isPressed ? 'active' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleToggle}
            title="Click to toggle or hold to press"
          >
            <div className="sim-btn-cap" />
          </button>
          <div className="sim-btn-status-text">
            {isPressed ? 'PRESSED (LOW)' : 'RELEASED (HIGH)'}
          </div>
        </div>

        <div className="sim-card-control">
          <label htmlFor={`pin-select-${config.id}`}>Pin</label>
          <select
            id={`pin-select-${config.id}`}
            value={config.pin}
            onChange={(e) => onPinChange(e.target.value)}
          >
            {DIGITAL_PIN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                D{p}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

interface PotentiometerCardProps {
  config: VirtualPotentiometerConfig
  engine: SimulationEngine
  onPinChange: (pin: string) => void
  onRemove: () => void
}

const PotentiometerCard: React.FC<PotentiometerCardProps> = ({
  config,
  engine,
  onPinChange,
  onRemove
}) => {
  const currentVal = engine.components.getPotentiometerValue(config.id)
  const voltage = ((currentVal / 1023) * engine.board.capabilities.voltage).toFixed(2)

  return (
    <div className="sim-card sim-card-pot">
      <div className="sim-card-header">
        <div className="sim-card-badge">POT</div>
        <div className="sim-card-title">{config.name}</div>
        <button
          type="button"
          className="sim-card-remove"
          onClick={onRemove}
          title="Remove Potentiometer"
        >
          &times;
        </button>
      </div>

      <div className="sim-card-body">
        <div className="sim-pot-meter">
          <div className="sim-pot-readout">
            <span className="sim-pot-val">{currentVal}</span>
            <span className="sim-pot-voltage">{voltage}V</span>
          </div>

          <input
            type="range"
            min="0"
            max="1023"
            step="1"
            value={currentVal}
            onChange={(e) =>
              engine.components.setPotentiometerValue(config.id, parseInt(e.target.value, 10))
            }
            className="sim-slider"
            title={`Slide to adjust voltage (0 - 1023)`}
          />
        </div>

        <div className="sim-card-control">
          <label htmlFor={`pin-select-${config.id}`}>Pin</label>
          <select
            id={`pin-select-${config.id}`}
            value={config.pin}
            onChange={(e) => onPinChange(e.target.value)}
          >
            {ANALOG_PIN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

interface DigitalSensorCardProps {
  config: VirtualDigitalSensorConfig
  engine: SimulationEngine
  onPinChange: (pin: string) => void
  onRemove: () => void
}

const DigitalSensorCard: React.FC<DigitalSensorCardProps> = ({
  config,
  engine,
  onPinChange,
  onRemove
}) => {
  const isActive = engine.components.isDigitalSensorActive(config.id)

  return (
    <div className={`sim-card sim-card-ds ${isActive ? 'active' : ''}`}>
      <div className="sim-card-header">
        <div className="sim-card-badge">DIGITAL SENSOR</div>
        <div className="sim-card-title">{config.name}</div>
        <button type="button" className="sim-card-remove" onClick={onRemove} title="Remove Sensor">
          &times;
        </button>
      </div>

      <div className="sim-card-body">
        <div className="sim-sensor-toggle">
          <button
            type="button"
            className={`sim-toggle-btn ${isActive ? 'active' : ''}`}
            onClick={() => engine.components.setDigitalSensorActive(config.id, !isActive)}
          >
            <span>{isActive ? 'HIGH (1)' : 'LOW (0)'}</span>
          </button>
        </div>

        <div className="sim-card-control">
          <label htmlFor={`pin-select-${config.id}`}>Pin</label>
          <select
            id={`pin-select-${config.id}`}
            value={config.pin}
            onChange={(e) => onPinChange(e.target.value)}
          >
            {DIGITAL_PIN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                D{p}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

interface AnalogSensorCardProps {
  config: VirtualAnalogSensorConfig
  engine: SimulationEngine
  onPinChange: (pin: string) => void
  onRemove: () => void
}

const AnalogSensorCard: React.FC<AnalogSensorCardProps> = ({
  config,
  engine,
  onPinChange,
  onRemove
}) => {
  const currentVal = engine.components.getAnalogSensorValue(config.id)

  return (
    <div className="sim-card sim-card-as">
      <div className="sim-card-header">
        <div className="sim-card-badge">ANALOG SENSOR</div>
        <div className="sim-card-title">{config.name}</div>
        <button type="button" className="sim-card-remove" onClick={onRemove} title="Remove Sensor">
          &times;
        </button>
      </div>

      <div className="sim-card-body">
        <div className="sim-pot-meter">
          <div className="sim-pot-readout">
            <span className="sim-pot-val">Reading: {currentVal}</span>
          </div>

          <input
            type="range"
            min="0"
            max="1023"
            step="1"
            value={currentVal}
            onChange={(e) =>
              engine.components.setAnalogSensorValue(config.id, parseInt(e.target.value, 10))
            }
            className="sim-slider"
          />
        </div>

        <div className="sim-card-control">
          <label htmlFor={`pin-select-${config.id}`}>Pin</label>
          <select
            id={`pin-select-${config.id}`}
            value={config.pin}
            onChange={(e) => onPinChange(e.target.value)}
          >
            {ANALOG_PIN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

interface UltrasonicCardProps {
  config: VirtualUltrasonicConfig
  engine: SimulationEngine
  onTrigPinChange: (pin: string) => void
  onEchoPinChange: (pin: string) => void
  onRemove: () => void
}

const UltrasonicCard: React.FC<UltrasonicCardProps> = ({
  config,
  engine,
  onTrigPinChange,
  onEchoPinChange,
  onRemove
}) => {
  const distance = engine.components.getUltrasonicDistance(config.id)

  return (
    <div className="sim-card sim-card-us">
      <div className="sim-card-header">
        <div className="sim-card-badge">SONAR</div>
        <div className="sim-card-title">{config.name}</div>
        <button type="button" className="sim-card-remove" onClick={onRemove} title="Remove Sensor">
          &times;
        </button>
      </div>

      <div className="sim-card-body">
        <div className="sim-us-display">
          <div className="sim-us-eyes" aria-hidden="true">
            <div className="sim-us-eye trig" title="Transmitter" />
            <div className="sim-us-eye echo" title="Receiver" />
          </div>
          <div className="sim-us-dist-readout">
            <strong>{distance}</strong> cm
          </div>
        </div>

        <input
          type="range"
          min="2"
          max="400"
          step="1"
          value={distance}
          onChange={(e) =>
            engine.components.setUltrasonicDistance(config.id, parseInt(e.target.value, 10))
          }
          className="sim-slider"
          title="Adjust distance between 2cm and 400cm"
        />

        <div className="sim-card-control-dual">
          <div className="sim-card-control">
            <label htmlFor={`trig-select-${config.id}`}>Trig</label>
            <select
              id={`trig-select-${config.id}`}
              value={config.trigPin}
              onChange={(e) => onTrigPinChange(e.target.value)}
            >
              {DIGITAL_PIN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  D{p}
                </option>
              ))}
            </select>
          </div>

          <div className="sim-card-control">
            <label htmlFor={`echo-select-${config.id}`}>Echo</label>
            <select
              id={`echo-select-${config.id}`}
              value={config.echoPin}
              onChange={(e) => onEchoPinChange(e.target.value)}
            >
              {DIGITAL_PIN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  D{p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
