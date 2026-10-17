# Third-Party Licenses & Software Notices

**Hepha** is licensed under the [Hepha Non-Commercial Source-Available License](file:///z:/CircuitForge/LICENSE).

This document details the third-party open-source components, toolchains, libraries, and utilities utilized by Hepha, including their respective licenses, attribution notices, and architectural boundary isolation analyses.

---

## 1. Summary of Third-Party Dependencies

| Component | Role / Purpose | License | Source / Repository |
|---|---|---|---|
| **Electron** | Cross-platform desktop runtime | MIT | [github.com/electron/electron](https://github.com/electron/electron) |
| **React & React-DOM** | User interface rendering engine | MIT | [github.com/facebook/react](https://github.com/facebook/react) |
| **Google Blockly** | Visual block-based programming workspace | Apache 2.0 | [github.com/google/blockly](https://github.com/google/blockly) |
| **SerialPort** | Node.js serial hardware communication stream | MIT | [github.com/serialport/node-serialport](https://github.com/serialport/node-serialport) |
| **@electron-toolkit/utils** | Electron IPC & window management helpers | MIT | [github.com/alex8088/electron-toolkit](https://github.com/alex8088/electron-toolkit) |
| **@vitejs/plugin-react** | Fast Refresh & JSX transform for Vite | MIT | [github.com/vitejs/vite-plugin-react](https://github.com/vitejs/vite-plugin-react) |
| **Vite & electron-vite** | Frontend bundler & development server | MIT | [github.com/alex8088/electron-vite](https://github.com/alex8088/electron-vite) |
| **Vitest** | Automated unit and regression test runner | MIT | [github.com/vitest-dev/vitest](https://github.com/vitest-dev/vitest) |
| **TypeScript** | Static type checker and transpiler | Apache 2.0 | [github.com/microsoft/TypeScript](https://github.com/microsoft/TypeScript) |
| **ESLint & Prettier** | Code quality linter and formatter | MIT | [github.com/eslint/eslint](https://github.com/eslint/eslint) |

---

## 2. External & Bundled Toolchains Compliance Analysis

Hepha delegates microcontroller sketch compilation, core package installation, and hardware flashing to independent external command-line utilities.

### 2.1 Arduino CLI (`arduino-cli`)
- **License**: GNU General Public License v3.0 (GPLv3)
- **Copyright**: Copyright (c) Arduino SA
- **Upstream Source**: [https://github.com/arduino/arduino-cli](https://github.com/arduino/arduino-cli)

#### Architectural Isolation & License Boundary Analysis
Hepha interacts with `arduino-cli` strictly as an **independent, separate program** executed via standard operating system subprocess spawning (`child_process.spawn()` in Node.js).
1. **Pipe & Process Boundary**: Communication occurs exclusively across standard OS pipes (`argv` arguments, `stdin`, and `stdout`/`stderr` serialized as newline-delimited JSON text streams).
2. **No In-Process Linking**: Hepha contains no C/C++ code, dynamic libraries (`.dll`, `.so`, `.dylib`), or compiled symbols linked against `arduino-cli`.
3. **FSF Compliance Guideline**: Under the Free Software Foundation's official GPL FAQ:
   > *"Pipes, sockets and command-line arguments are the communication mechanisms usually used between two separate programs... So when every program is an independent executable that communicates with others over pipes or sockets, they are considered separate programs."*
4. **Conclusion**: Hepha is not a derivative work of `arduino-cli`. The distribution of Hepha alongside or downloading `arduino-cli` as an independent tool does not infect Hepha's proprietary or source-available non-commercial license.

### 2.2 Microcontroller Core Toolchains
When downloaded via the toolchain manager, hardware platforms utilize the following upstream tools:
- **AVR (avrdude & avr-gcc)**: GPLv2+ / GPLv3 (Executed as standalone subprocesses by `arduino-cli`).
- **ESP32 (esptool.py)**: GPLv2+ (Espressif Systems; executed out-of-process).
- **RP2040 (picotool & elf2uf2)**: BSD-3-Clause (Raspberry Pi Foundation).

---

## 3. License Texts & Attributions

### 3.1 MIT License
*Applies to: Electron, React, React-DOM, SerialPort, Vite, electron-vite, Vitest, ESLint, Prettier, @electron-toolkit/utils*

```text
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### 3.2 Apache License, Version 2.0
*Applies to: Google Blockly, TypeScript*

```text
                              Apache License
                        Version 2.0, January 2004
                     http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.
   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   "Licensor" shall mean the copyright owner or entity authorized by
   the copyright owner that is granting the License.

2. Grant of Copyright License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   copyright license to reproduce, prepare Derivative Works of,
   publicly display, publicly perform, sublicense, and distribute the
   Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   patent license to make, have made, use, offer to sell, sell, import,
   and otherwise transfer the Work.

4. Redistribution. You may reproduce and distribute copies of the
   Work or Derivative Works thereof in any medium, with or without
   modifications, and in Source or Object form, provided that You
   meet the following conditions:

   (a) You must give any other recipients of the Work or
       Derivative Works a copy of this License; and
   (b) You must cause any modified files to carry prominent notices
       stating that You changed the files; and
   (c) You must retain, in the Source form of any Derivative Works
       that You distribute, all copyright, patent, trademark, and
       attribution notices from the Source form of the Work; and
   (d) If the Work includes a "NOTICE" text file as part of its
       distribution, then any Derivative Works that You distribute must
       include a readable copy of the attribution notices contained
       within such NOTICE file.

5. Disclaimer of Warranty. Unless required by applicable law or agreed
   to in writing, Licensor provides the Work (and each Contributor
   provides its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES
   OR CONDITIONS OF ANY KIND, either express or implied.
```

---

### 3.3 BSD 3-Clause License
*Applies to: picotool, elf2uf2*

```text
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
