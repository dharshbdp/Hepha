/**
 * Demonstration Projects for Hepha Simulation Mode
 * Section 10 of Implementation Specification:
 * - Example A: LED Blink
 * - Example B: Button-Controlled LED
 * - Example C: Analog Input
 * - Example D: Ultrasonic Distance Sensor
 */

import type { VirtualCircuitConfig } from './types'

export interface SimulationDemoProject {
  id: string
  name: string
  description: string
  boardId: string
  circuitConfig: VirtualCircuitConfig
  workspace: Record<string, unknown>
}

// -------------------------------------------------------------------------
// Example A: LED Blink
// -------------------------------------------------------------------------
export const DEMO_PROJECT_BLINK: SimulationDemoProject = {
  id: 'demo_blink',
  name: 'Example A: LED Blink',
  description: 'Digital GPIO output toggles an LED on Pin 13 with 500ms virtual delay cycles.',
  boardId: 'arduino_uno',
  circuitConfig: {
    boardId: 'arduino_uno',
    components: [
      {
        id: 'led_13',
        type: 'led',
        name: 'Status LED (D13)',
        pin: '13',
        color: '#22c55e'
      }
    ]
  },
  workspace: {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'pin_digital_write',
          id: 'blk_blink_high',
          x: 48,
          y: 48,
          fields: { PIN: '13', STATE: 'HIGH' },
          next: {
            block: {
              type: 'time_delay',
              id: 'blk_delay_1',
              inputs: {
                DELAY_MS: {
                  shadow: { type: 'math_number', id: 'num_500_1', fields: { NUM: 500 } }
                }
              },
              next: {
                block: {
                  type: 'pin_digital_write',
                  id: 'blk_blink_low',
                  fields: { PIN: '13', STATE: 'LOW' },
                  next: {
                    block: {
                      type: 'time_delay',
                      id: 'blk_delay_2',
                      inputs: {
                        DELAY_MS: {
                          shadow: { type: 'math_number', id: 'num_500_2', fields: { NUM: 500 } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }
  }
}

// -------------------------------------------------------------------------
// Example B: Button-Controlled LED
// -------------------------------------------------------------------------
export const DEMO_PROJECT_BUTTON: SimulationDemoProject = {
  id: 'demo_button',
  name: 'Example B: Button-Controlled LED',
  description:
    'Reads push button on Pin 2 (INPUT_PULLUP) and drives LED on Pin 13 based on button state.',
  boardId: 'arduino_uno',
  circuitConfig: {
    boardId: 'arduino_uno',
    components: [
      {
        id: 'btn_2',
        type: 'button',
        name: 'Push Button (D2)',
        pin: '2',
        activeLow: true
      },
      {
        id: 'led_13',
        type: 'led',
        name: 'Indicator LED (D13)',
        pin: '13',
        color: '#3b82f6'
      }
    ]
  },
  workspace: {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'controls_if',
          id: 'blk_btn_if',
          x: 48,
          y: 48,
          extraState: { hasElse: true },
          inputs: {
            IF0: {
              block: {
                type: 'logic_compare',
                id: 'cmp_pressed',
                fields: { OP: 'EQ' },
                inputs: {
                  A: {
                    block: {
                      type: 'pin_digital_read',
                      id: 'read_btn',
                      fields: { PIN: '2' }
                    }
                  },
                  B: {
                    shadow: { type: 'math_number', id: 'num_0', fields: { NUM: 0 } }
                  }
                }
              }
            },
            DO0: {
              block: {
                type: 'pin_digital_write',
                id: 'write_led_on',
                fields: { PIN: '13', STATE: 'HIGH' },
                next: {
                  block: {
                    type: 'serial_print',
                    id: 'print_pressed',
                    fields: { NEWLINE: true },
                    inputs: {
                      CONTENT: {
                        shadow: {
                          type: 'text',
                          id: 'txt_on',
                          fields: { TEXT: 'Button Pressed -> LED ON' }
                        }
                      }
                    }
                  }
                }
              }
            },
            ELSE: {
              block: {
                type: 'pin_digital_write',
                id: 'write_led_off',
                fields: { PIN: '13', STATE: 'LOW' }
              }
            }
          },
          next: {
            block: {
              type: 'time_delay',
              id: 'btn_loop_delay',
              inputs: {
                DELAY_MS: {
                  shadow: { type: 'math_number', id: 'num_50', fields: { NUM: 50 } }
                }
              }
            }
          }
        }
      ]
    }
  }
}

// -------------------------------------------------------------------------
// Example C: Analog Input Potentiometer
// -------------------------------------------------------------------------
export const DEMO_PROJECT_ANALOG: SimulationDemoProject = {
  id: 'demo_analog',
  name: 'Example C: Analog Potentiometer & PWM',
  description:
    'Reads analog voltage from Potentiometer on A0 and modulates LED brightness on PWM Pin 9.',
  boardId: 'arduino_uno',
  circuitConfig: {
    boardId: 'arduino_uno',
    components: [
      {
        id: 'pot_a0',
        type: 'potentiometer',
        name: 'Rotary Potentiometer (A0)',
        pin: 'A0',
        currentValue: 512
      },
      {
        id: 'led_pwm_9',
        type: 'led',
        name: 'PWM Brightness LED (~D9)',
        pin: '9',
        color: '#f59e0b'
      }
    ]
  },
  workspace: {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'variables_set',
          id: 'set_sensor_val',
          x: 48,
          y: 48,
          fields: { VAR: 'sensorValue' },
          inputs: {
            VALUE: {
              block: {
                type: 'pin_analog_read',
                id: 'read_a0',
                fields: { PIN: 'A0' }
              }
            }
          },
          next: {
            block: {
              type: 'pin_analog_write',
              id: 'write_pwm_9',
              fields: { PIN: '9' },
              inputs: {
                VALUE: {
                  block: {
                    type: 'math_arithmetic',
                    id: 'scale_pwm',
                    fields: { OP: 'DIVIDE' },
                    inputs: {
                      A: {
                        block: {
                          type: 'variables_get',
                          id: 'get_sensor_val',
                          fields: { VAR: 'sensorValue' }
                        }
                      },
                      B: {
                        shadow: { type: 'math_number', id: 'num_4', fields: { NUM: 4 } }
                      }
                    }
                  }
                }
              },
              next: {
                block: {
                  type: 'serial_print',
                  id: 'print_pot_val',
                  fields: { NEWLINE: true },
                  inputs: {
                    CONTENT: {
                      block: {
                        type: 'variables_get',
                        id: 'get_pot_print',
                        fields: { VAR: 'sensorValue' }
                      }
                    }
                  },
                  next: {
                    block: {
                      type: 'time_delay',
                      id: 'analog_delay',
                      inputs: {
                        DELAY_MS: {
                          shadow: { type: 'math_number', id: 'num_100', fields: { NUM: 100 } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }
  }
}

// -------------------------------------------------------------------------
// Example D: Ultrasonic Distance Sensor
// -------------------------------------------------------------------------
export const DEMO_PROJECT_ULTRASONIC: SimulationDemoProject = {
  id: 'demo_ultrasonic',
  name: 'Example D: Ultrasonic Distance Detection',
  description:
    'Measures virtual ultrasonic distance; activates alarm LED on Pin 13 if distance < 30 cm.',
  boardId: 'arduino_uno',
  circuitConfig: {
    boardId: 'arduino_uno',
    components: [
      {
        id: 'hc_sr04',
        type: 'ultrasonic',
        name: 'Ultrasonic Distance (HC-SR04)',
        trigPin: '9',
        echoPin: '10',
        distanceCm: 45
      },
      {
        id: 'led_alert',
        type: 'led',
        name: 'Proximity Alert LED (D13)',
        pin: '13',
        color: '#ef4444'
      }
    ]
  },
  workspace: {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'variables_set',
          id: 'set_dist_var',
          x: 48,
          y: 48,
          fields: { VAR: 'distance' },
          inputs: {
            VALUE: {
              block: {
                type: 'sensor_ultrasonic',
                id: 'us_block_read',
                fields: { TRIG_PIN: '9', ECHO_PIN: '10' }
              }
            }
          },
          next: {
            block: {
              type: 'controls_if',
              id: 'if_too_close',
              extraState: { hasElse: true },
              inputs: {
                IF0: {
                  block: {
                    type: 'logic_compare',
                    id: 'cmp_threshold',
                    fields: { OP: 'LT' },
                    inputs: {
                      A: {
                        block: {
                          type: 'variables_get',
                          id: 'get_dist_cmp',
                          fields: { VAR: 'distance' }
                        }
                      },
                      B: {
                        shadow: { type: 'math_number', id: 'num_30', fields: { NUM: 30 } }
                      }
                    }
                  }
                },
                DO0: {
                  block: {
                    type: 'pin_digital_write',
                    id: 'alert_on',
                    fields: { PIN: '13', STATE: 'HIGH' },
                    next: {
                      block: {
                        type: 'serial_print',
                        id: 'print_warn_obj',
                        fields: { NEWLINE: true },
                        inputs: {
                          CONTENT: {
                            shadow: {
                              type: 'text',
                              id: 'txt_warn_obj',
                              fields: { TEXT: 'WARNING: Object within 30cm!' }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                ELSE: {
                  block: {
                    type: 'pin_digital_write',
                    id: 'alert_off',
                    fields: { PIN: '13', STATE: 'LOW' }
                  }
                }
              },
              next: {
                block: {
                  type: 'time_delay',
                  id: 'us_delay',
                  inputs: {
                    DELAY_MS: {
                      shadow: { type: 'math_number', id: 'num_150', fields: { NUM: 150 } }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }
  }
}

export const DEMO_PROJECTS: SimulationDemoProject[] = [
  DEMO_PROJECT_BLINK,
  DEMO_PROJECT_BUTTON,
  DEMO_PROJECT_ANALOG,
  DEMO_PROJECT_ULTRASONIC
]
