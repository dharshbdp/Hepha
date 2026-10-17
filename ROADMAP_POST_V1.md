# Hepha — Post-v1.0 Evolution Roadmap

> **Status:** Hepha v1.0.0 is the completed baseline. This document describes possible post-release evolution; it does not reclassify completed v1.0 work as unfinished.

Hepha is a visual IoT development environment for building, translating, compiling, flashing, and monitoring embedded projects. The next stage should deepen reliability and engineering capability while exploring a carefully isolated integration with **Robbie**, a separate custom AI/LLM project.

## Guiding direction

- **Hepha remains the engineering environment:** project state, Blockly, code generation, validation, compilation, flashing, serial communication, and telemetry.
- **Robbie may become a native intelligence option:** project explanations, design planning, code suggestions, debugging assistance, and eventually structured project-edit proposals.
- **Keep the projects decoupled:** communicate through a versioned, documented interface rather than merging the codebases.
- **Preserve user control:** AI suggestions are reviewable; project changes are validated; firmware uploads and consequential hardware actions require explicit approval.
- **Never treat model output as trusted code:** validate structured responses and generated code before applying or executing them.

## Workstreams

### 1. v1.x — Reliability and release quality

**Goal:** Make the v1.0 baseline easier to trust, test, install, and maintain.

- [ ] Establish automated tests for project serialization, code generation, parsing, diagnostics, and IPC contracts.
- [ ] Add regression fixtures for representative Arduino C++ sketches and Blockly workspaces.
- [ ] Verify clean installation, launch, update, and uninstall paths on supported operating systems.
- [ ] Test compilation and flashing on physical supported boards; document tested board/core versions.
- [ ] Improve crash/error reporting and actionable diagnostics without exposing secrets or personal data.
- [ ] Audit dependency licenses, bundled toolchains, release artifacts, and the source-available license.
- [ ] Maintain a compatibility matrix for OS, Node/Electron build environment, boards, and toolchains.

**Exit criteria:** repeatable builds, documented test results, no known critical release-blocking defects, and reproducible release instructions.

### 2. Robbie integration — Research prototype

**Goal:** Evaluate Robbie as an optional intelligence backend without making Hepha depend on its current capabilities.

- [ ] Define a versioned request/response contract for prompts, context, streamed output, cancellation, errors, and capability reporting.
- [ ] Keep Robbie in a separate process or service behind a narrow Hepha-side adapter.
- [ ] Start with read-only assistance: explain the current project, summarize generated code, and answer questions about available board/block context.
- [ ] Add provider configuration so Hepha can use Robbie when available and retain its existing functionality when it is unavailable.
- [ ] Benchmark Robbie on a fixed set of embedded-programming tasks; record correctness, unsupported claims, latency, and resource use.
- [ ] Avoid sending project files, serial logs, telemetry, or credentials to an external service without clear user choice.

**Exit criteria:** Hepha works normally when Robbie is offline or disabled; the integration can be tested independently; failures are recoverable and visible.

### 3. Context-aware engineering assistant

**Goal:** Give the assistant useful, bounded context rather than unrestricted access to the application.

- [ ] Build a minimal project-context snapshot: selected board, active blocks, generated code, pin assignments, current diagnostics, and user-selected serial/telemetry excerpts.
- [ ] Clearly show which context is being shared with the configured model.
- [ ] Ground responses in the available project context and distinguish facts from assumptions.
- [ ] Add debugging workflows that summarize compiler errors and suggest candidate fixes.
- [ ] Use telemetry analysis only when the user chooses to share the relevant data.
- [ ] Test with incomplete projects, invalid model responses, timeouts, and contradictory hardware information.

**Exit criteria:** responses are useful, appropriately qualified, and do not silently invent board capabilities or wiring facts.

### 4. Reviewable AI project changes

**Goal:** Let AI propose edits while keeping Hepha deterministic and recoverable.

- [ ] Define a strict schema for proposed block additions, updates, removals, and code changes.
- [ ] Preview the proposed diff before modifying the active project.
- [ ] Run existing schema checks, block validation, pin diagnostics, and code-generation checks before applying changes.
- [ ] Provide apply, reject, undo, and restore options.
- [ ] Preserve unsupported source code and project data; never silently discard user-authored content.
- [ ] Require explicit confirmation before compilation, firmware flashing, or other consequential hardware actions.

**Exit criteria:** invalid proposals are rejected safely; accepted changes are reviewable and reversible; the original project can be restored.

### 5. Deeper embedded development tools

**Goal:** Improve Hepha's usefulness beyond prompt-to-block generation.

- [ ] Improve code-to-block fidelity reporting and handling of unsupported language constructs.
- [ ] Expand board and component profiles through a documented, testable extension format.
- [ ] Add reusable project tests and sensor-input test fixtures.
- [ ] Explore simulation for supported blocks and peripherals, clearly marking what is simulated versus real.
- [ ] Explore hardware-in-the-loop workflows where reliable board-specific support exists.
- [ ] Investigate richer debugging workflows where the target MCU and toolchain support them.

**Exit criteria:** new capabilities have explicit support boundaries and do not compromise existing compile, upload, serial, or project-storage workflows.

### 6. Hepha ecosystem and long-term differentiation

**Goal:** Make Hepha extensible and distinctive without accumulating fragile features.

- [ ] Document how to add board profiles, sensor definitions, blocks, and code generators.
- [ ] Create example projects and concise onboarding documentation.
- [ ] Add project export/import and diagnostics that help users share reproducible bug reports.
- [ ] Evaluate community contributions and third-party component licensing.
- [ ] Explore novel AI-assisted workflows—such as proposing experiments based on observed sensor data—only after the underlying test and validation paths are reliable.

## Suggested order

1. Reliability and regression tests.
2. Robbie interface and read-only prototype.
3. Context-aware explanations and debugging.
4. Reviewable, validated AI edits.
5. Simulation and advanced hardware workflows.
6. Ecosystem improvements based on real user feedback.

These are proposed workstreams, not promised release dates. Prioritize based on test results, actual hardware support, and the measured quality of Robbie.

## Architecture boundary

```text
Hepha UI
  ├── Blockly / code editor / project context
  ├── Existing validation and hardware diagnostics
  ├── Compile / upload / serial / telemetry services
  └── Assistant adapter (versioned contract)
              │
              ▼
       Robbie (optional service)
       planning / explanations / suggestions
```

Robbie proposes; Hepha validates and performs approved operations. The UI renderer should continue to access privileged operations only through Hepha's typed, restricted IPC bridge. The assistant should not receive unrestricted shell, filesystem, or firmware-flashing access.

## Definition of success

Hepha should remain a useful embedded-development IDE without Robbie. With Robbie enabled, it should become easier to understand, build, and debug embedded projects—without sacrificing predictable hardware behavior, user ownership of project changes, offline workflows, or recoverability.

---

*Last revised: 2026-10-17*
