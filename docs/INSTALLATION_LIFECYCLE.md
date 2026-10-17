# Hepha Installation & Application Lifecycle

This document defines the lifecycle, packaging, installation, runtime initialization, update mechanics, and uninstallation procedures for **Hepha** across all supported desktop platforms.

---

## 1. Distribution Artifacts & Formats

Hepha releases are packaged with `electron-builder` into the following native artifacts:

| Platform | Format | Artifact Filename | Purpose | Target Audience |
|---|---|---|---|---|
| **Windows** | NSIS Installer | `Hepha-<version>-Windows-Setup.exe` | Standard Windows installer with start menu, desktop shortcuts, and Add/Remove Programs registration | General Windows users |
| **Windows** | Portable EXE | `Hepha-<version>-Windows-Portable.exe` | Standalone zero-installation binary; writes caches locally | Classroom / Restricted PCs / USB drives |
| **macOS** | DMG Package | `Hepha-<version>-macOS-<arch>.dmg` | Drag-and-drop installer for `/Applications` | Standard macOS users (Intel & Apple Silicon) |
| **macOS** | ZIP Archive | `Hepha-<version>-macOS-<arch>.zip` | Direct unpack archive | Enterprise / Scripted deployments |
| **Linux** | AppImage | `Hepha-<version>-Linux-x86_64.AppImage` | Self-contained, distribution-agnostic executable | Ubuntu, Fedora, Arch, OpenSUSE |
| **Linux** | Debian (`.deb`) | `Hepha-<version>-Linux-amd64.deb` | APT-managed package installing to `/opt/Hepha` with desktop entry | Debian, Ubuntu, Linux Mint |

---

## 2. Installation Paths & System Permissions

### Windows
- **NSIS Default Install Directory**:
  - Per-User (Default): `%LOCALAPPDATA%\Programs\Hepha\`
  - System-wide (Admin): `C:\Program Files\Hepha\`
- **App Data & User Configuration**:
  - User Settings & Recents: `%APPDATA%\hepha\settings.json`
  - Temporary Compiler Builds: `%TEMP%\hepha_builds\`
- **Hardware Drivers**:
  - Arduino Uno R3 / Mega / Nano (new bootloader) utilize standard Microsoft USB CDC-ACM driver (`usbser.sys`).
  - CH340 / CH341 (common on low-cost Nano/ESP32 clones) requires the WCH CH341SER driver if not pre-installed by Windows Update.
  - CP2102 (Silicon Labs) uses the standard VCP driver.

### macOS
- **Install Directory**: `/Applications/Hepha.app`
- **User Configuration**: `~/Library/Application Support/hepha/`
- **Gatekeeper & Permissions**:
  - If downloaded from GitHub Releases without Apple notarization ticket, macOS may display a Gatekeeper warning.
  - *Remediation*: Right-click `Hepha.app` in `/Applications` and select **Open**, or run:
    ```bash
    xattr -cr /Applications/Hepha.app
    ```
  - Serial port access does not require `sudo`. Devices appear under `/dev/cu.usbserial-*` and `/dev/cu.usbmodem*`.

### Linux
- **AppImage Execution**:
  ```bash
  chmod +x Hepha-1.0.0-Linux-x86_64.AppImage
  ./Hepha-1.0.0-Linux-x86_64.AppImage --no-sandbox
  ```
- **Serial Port Permissions (Dialout Group)**:
  Linux distributions restrict raw access to `/dev/ttyUSB*` and `/dev/ttyACM*` to members of the `dialout` (or `uucp`) group. Users must be added to this group:
  ```bash
  sudo usermod -aG dialout $USER
  # Log out and log back in, or run:
  newgrp dialout
  ```
- **User Configuration**: `~/.config/hepha/`

---

## 3. Application Lifecycle Flow

```text
[App Launch]
    │
    ├── 1. Hook process.on('uncaughtException') & unhandledRejection (errorSanitizer)
    ├── 2. Prune stale build directories from %TEMP%/hepha_builds/
    ├── 3. Set Application User Model ID ('io.hepha.desktop')
    ├── 4. Register IPC Channels (Projects, Serial, Compiler, Toolchain, Copilot)
    ├── 5. Create BrowserWindow (1100x750 min 850x600)
    │
[User Session]
    │
    ├── Canvas & Workspace Edits (Blockly AST + Circuit State)
    ├── Real-time static diagnostics & pin conflict validation
    ├── Serial Terminal Connection (exclusive lock on COM/tty port)
    ├── Code Generation & arduino-cli compile (isolated %TEMP% sketch)
    └── Flash to Microcontroller (temporary release of serial port, flash, re-bind)
    │
[App Shutdown / Exit]
    │
    ├── 1. Release active serial port locks (disconnectSerialPort())
    ├── 2. Prune active session build caches (%TEMP%/hepha_builds/)
    └── 3. Close windows & terminate main process
```

---

## 4. Updates & Version Upgrades

Hepha supports automatic and manual updates:
1. **GitHub Releases Auto-Update**:
   - `electron-builder` checks `https://github.com/dharshbdp/Hepha/releases/latest` for release manifests (`latest.yml`, `latest-mac.yml`, `latest-linux.yml`).
   - Downloads are verified against SHA-512 hashes published in the release manifest.
2. **Project File Backward Compatibility**:
   - Hepha project files (`.hepha`) and legacy CircuitForge project files (`.circuitforge`) remain 100% forward and backward compatible through the versioned schema deserializer (`graphSerializer.ts`).

---

## 5. Clean Uninstallation Procedures

### Windows
- Open **Windows Settings** → **Apps & Features** (or `appwiz.cpl`) → Select **Hepha** → Click **Uninstall**.
- The NSIS uninstaller:
  - Deletes all binaries, shortcuts, and registry entries under `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\io.hepha.desktop`.
  - By default, user project files (`.hepha`) and custom sketches are **preserved** to prevent accidental data loss.
  - To perform a complete clean purge including caches:
    ```powershell
    Remove-Item -Recurse -Force "$env:APPDATA\hepha"
    Remove-Item -Recurse -Force "$env:TEMP\hepha_builds"
    ```

### macOS
- Drag `/Applications/Hepha.app` to the **Trash**.
- (Optional) Purge caches and saved settings:
  ```bash
  rm -rf ~/Library/Application\ Support/hepha
  rm -rf ~/Library/Caches/io.hepha.desktop*
  ```

### Linux
- **AppImage**: Simply delete the `.AppImage` file and `~/.config/hepha`.
- **Debian package**:
  ```bash
  sudo apt remove --purge hepha
  rm -rf ~/.config/hepha
  ```
