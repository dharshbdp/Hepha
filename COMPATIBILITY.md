# Hepha Master Compatibility Matrix

This document defines the certified compatibility matrix for **Hepha**, covering host operating systems, desktop build runtimes, target microcontroller boards, core toolchains, and communication drivers.

---

## 1. Host Operating Systems Support

| Operating System | Architecture | Minimum Version | Verified Releases | Packaging / Distribution | Known Platform Notes |
|---|---|---|---|---|---|
| **Microsoft Windows** | x64 (AMD64) | Windows 10 (1809+) | Windows 10 22H2, Windows 11 23H2/24H2 | NSIS Installer (`.exe`), Portable (`.exe`) | Standard `usbser.sys` CDC driver built into Windows 10/11. CH340 clones require WCH driver. |
| **Microsoft Windows** | ARM64 | Windows 11 (22H2+) | Windows 11 on Snapdragon X Elite | Portable / x64 emulated installer | Seamless execution via Windows 11 Prism/x64 binary translation. |
| **macOS** | Apple Silicon (arm64) | macOS 12 (Monterey) | Sonoma 14.x, Sequoia 15.x (M1/M2/M3/M4) | DMG (`.dmg`), ZIP (`.zip`) | Native ARM64 binary. Serial devices appear under `/dev/cu.usbmodem*` and `/dev/cu.usbserial-*`. |
| **macOS** | Intel (x86_64) | macOS 12 (Monterey) | Monterey 12.7, Ventura 13.6 | DMG (`.dmg`), ZIP (`.zip`) | Native x64 binary for legacy Intel Mac hardware. |
| **Linux** | x86_64 (amd64) | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04/24.04, Fedora 39/40, Arch Linux | AppImage (`.AppImage`), Debian Package (`.deb`) | Requires user addition to `dialout` group for serial port access (`sudo usermod -aG dialout $USER`). |

---

## 2. Desktop Runtime & Build Environment

| Layer / Technology | Certified Version | Supported Range | Upstream Vendor |
|---|---|---|---|
| **Node.js** | `v22.14.0` | `^20.12.0` or `>=22.0.0` | OpenJS Foundation |
| **Electron Runtime** | `39.2.6` | `^39.0.0` | GitHub / OpenJS |
| **Chromium Engine** | `134.0.6998.36` | Built into Electron 39 | Google |
| **V8 JavaScript Engine** | `13.4.114.12` | Built into Electron 39 | Google |
| **React** | `19.2.1` | `^19.0.0` | Meta Platforms, Inc. |
| **Google Blockly** | `13.3.0` | `^13.0.0` | Google LLC |
| **SerialPort** | `13.0.0` | `^13.0.0` | Node SerialPort Organization |
| **Vite & electron-vite** | Vite `7.2.6`, electron-vite `5.0.0` | Latest | Evan You & Alex8088 |
| **TypeScript** | `5.9.3` | `^5.5.0` | Microsoft Corporation |
| **Vitest** | `5.0.5` | `^5.0.0` | Vitest Team |

---

## 3. Microcontroller Boards & Architectures

| Board Model | MCU / Chipset | Clock Frequency | Flash Memory | SRAM | Operating Voltage | Pin Voltage Tolerance | Flash Baud Rate | Serial Monitor Baud Rate |
|---|---|---|---|---|---|---|---|---|
| **Arduino Uno R3** | ATmega328P | 16 MHz | 32 KB | 2 KB | 5.0 V | 5.0 V logic | 115200 | 9600, 115200 |
| **Arduino Nano** | ATmega328P | 16 MHz | 32 KB | 2 KB | 5.0 V | 5.0 V logic | 115200 (new) / 57600 (old) | 9600, 115200 |
| **Arduino Mega 2560** | ATmega2560 | 16 MHz | 256 KB | 8 KB | 5.0 V | 5.0 V logic | 115200 | 9600, 115200 |
| **ESP32 DevKit V1** | ESP-WROOM-32 | 240 MHz (dual) | 4 MB | 520 KB | 3.3 V | **3.3 V max** (NOT 5V tolerant) | 921600 | 115200 |
| **Raspberry Pi Pico** | RP2040 | 133 MHz (dual) | 2 MB | 264 KB | 3.3 V | **3.3 V max** (NOT 5V tolerant) | USB CDC / 1200 bps | 115200 |

> [!WARNING]
> **Voltage Domain Hazard Alert**:
> Connecting 5V digital sensor signals directly into an ESP32 or Raspberry Pi Pico GPIO pin without a bidirectional level shifter or resistor divider will damage the SoC. Hepha's static diagnostic engine automatically warns of cross-voltage hazards when 5V sensors are coupled with 3.3V boards.

---

## 4. Compiler Toolchain & Core Platform Packages

| Target Platform | Package FQBN | Core Identifier | Certified Core Release | Embedded Flash Utility |
|---|---|---|---|---|
| **AVR 8-bit** | `arduino:avr:uno`, `arduino:avr:nano`, `arduino:avr:mega` | `arduino:avr` | `1.8.6` | `avrdude` v6.3 |
| **Espressif ESP32** | `esp32:esp32:esp32` | `esp32:esp32` | `2.0.17` & `3.0.x` | `esptool.py` v4.5+ |
| **Raspberry Pi RP2040** | `rp2040:rp2040:rpipico` | `rp2040:rp2040` (Earle Philhower Core) | `3.7.2` | `picotool` / `elf2uf2` |
| **Compiler Binary** | — | `arduino-cli` | `0.35.x` through `1.1.x+` | Standard JSON API |

---

## 5. Serial Hardware Interfaces & USB Bridges

| USB Bridge Chip | Typical Hardware Implementation | Vendor ID (VID) | Product ID (PID) | Driver Requirements |
|---|---|---|---|---|
| **ATmega16U2** | Official Arduino Uno R3, Mega 2560 | `0x2341` | `0x0043`, `0x0042`, `0x0001` | Plug-and-play USB CDC-ACM (no driver installation needed on modern OS) |
| **WCH CH340 / CH341** | Budget Nano, Uno, and ESP32 clones | `0x1A86` | `0x7523`, `0x5523` | WCH CH341SER driver (Windows) / Built into Linux & macOS 11+ |
| **Silicon Labs CP2102** | NodeMCU, ESP32 DevKit V1 | `0x10C4` | `0xEA60` | Silicon Labs CP210x VCP Driver |
| **FTDI FT232R** | Original Arduino Nano, industrial modules | `0x0403` | `0x6001` | FTDI CDM Certified Driver |
| **Raspberry Pi Native USB** | Raspberry Pi Pico (RP2040) | `0x2E8A` | `0x0005` (CDC), `0x0003` (BOOTSEL) | Native USB CDC serial endpoint & Mass Storage UF2 bootloader |

---

## 6. Backward Compatibility & Project Migration

| File Extension | Format Name | Version Identifier | Status | Supported Actions |
|---|---|---|---|---|
| `.hepha` | Hepha Project File | `1.0` | **Active / Current** | Read, Write, Autosave, Export |
| `.circuitforge` | Legacy CircuitForge File | `1.0` | **Deprecated / Supported** | Read, Transparent Upgrade to `.hepha`, Migration Prompts |
