# Agent Documentation Index

Welcome to the Study Timer project documentation. This folder contains all critical information for engineers to get full context of the system.

---

## Quick Start

1. **New to the project?** Start with [System/project_architecture.md](System/project_architecture.md)
2. **Setting up a device for testing?** See [System/demo_setup.md](System/demo_setup.md)
3. **Understanding the data layer?** Read [System/data_architecture.md](System/data_architecture.md)
4. **Checking implementation progress?** View [System/implementation_status.md](System/implementation_status.md)

---

## Directory Structure

```
.agent/
├── README.md              # This index file
├── System/                # System architecture and technical documentation
├── Tasks/                 # PRD and implementation plans for features
├── SOP/                   # Standard Operating Procedures
└── Wireframes/            # UI/UX wireframes and mockups
```

---

## System Documentation

Core technical documentation for understanding the system architecture.

| Document | Description |
|----------|-------------|
| [System/project_architecture.md](System/project_architecture.md) | **START HERE** - Project overview, tech stack, file structure, integration points |
| [System/data_architecture.md](System/data_architecture.md) | SQLite schema, data flows, Zustand store design, native bridge API |
| [System/demo_setup.md](System/demo_setup.md) | Complete guide for testing on physical iPhone with Live Activities |
| [System/implementation_status.md](System/implementation_status.md) | Current implementation progress by phase |

---

## Wireframes

ASCII wireframes for all UI screens and components.

| Document | Description |
|----------|-------------|
| [Wireframes/TimerScreen.md](Wireframes/TimerScreen.md) | Main timer screen - default, running, and paused states |
| [Wireframes/HistoryScreen.md](Wireframes/HistoryScreen.md) | Session history list, filters, detail view, empty state |
| [Wireframes/SettingsScreen.md](Wireframes/SettingsScreen.md) | App settings - defaults, notifications, data management |
| [Wireframes/SessionInput.md](Wireframes/SessionInput.md) | Session name input flow - inline, bottom sheet, and modal options |
| [Wireframes/LiveActivity.md](Wireframes/LiveActivity.md) | Dynamic Island (compact, minimal, expanded) + Lock Screen widget |
| [Wireframes/NavigationFlow.md](Wireframes/NavigationFlow.md) | App navigation structure, screen flows, modal hierarchy |

---

## Tasks

Feature PRDs and implementation plans.

| Document | Description |
|----------|-------------|
| *(None yet - add as features are planned)* | |

---

## SOP (Standard Operating Procedures)

Best practices for common development tasks.

| Document | Description |
|----------|-------------|
| *(None yet - add as patterns emerge)* | |

**Recommended SOPs to create:**
- How to add a new screen/route
- How to add a database migration
- How to update the native bridge
- How to test Live Activities locally

---

## Project Summary

### What We're Building

A React Native/Expo iOS study timer app that displays a **Live Activity** on the iOS lock screen and **Dynamic Island**. The React Native app controls the timer; the native iOS Live Activity reflects its state in real-time.

### Core Features

| Feature | Description |
|---------|-------------|
| Timer UI | Start, pause, resume, stop with session naming |
| Live Activity | Real-time timer display on Lock Screen |
| Dynamic Island | Compact, minimal, and expanded views |
| Session History | SQLite-persisted session records with stats |
| Edge Cases | Background handling, app kill recovery |

### Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native + Expo |
| State | Zustand |
| Database | expo-sqlite |
| Native Bridge | Expo Modules |
| iOS Integration | ActivityKit (Swift/SwiftUI) |

### Requirements

- macOS 13.0+ with Xcode 15.0+
- Node.js 18+
- Physical iPhone with iOS 16.1+ (Live Activities)
- iPhone 14 Pro+ for Dynamic Island
- Apple Developer Account (paid)

---

## Session Context

Active development sessions are tracked in `.claude/Tasks/context_session_*.md`.

Current session: [context_session_20260130_1540.md](../.claude/Tasks/context_session_20260130_1540.md)

---

## Contributing

When updating documentation:

1. Keep this README.md as the central index
2. Add new docs to the appropriate subdirectory
3. Update the relevant table above with new documents
4. Include "Related Documentation" section in each doc
5. Update `implementation_status.md` after completing work

---

*Last updated: 2026-01-30*
