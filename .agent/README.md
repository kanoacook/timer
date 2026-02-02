# Agent Documentation Index

Welcome to the Study Timer project documentation. This folder contains all critical information for engineers to get full context of the system.

---

## Current Status

**Timer UI + Live Activities Implemented**

- iOS-native styled timer screen with circular buttons
- Live Activity integration (Lock Screen + Dynamic Island)
- Full start/pause/resume/stop flow with ActivityKit sync

**To test:** `npx expo start` (simulator) or `npx expo run:ios --device` (physical device for Live Activities)

## Quick Start

1. **New to the project?** Start with [System/project_architecture.md](System/project_architecture.md)
2. **Building with Live Activities?** Follow [SOP/live_activity_build.md](SOP/live_activity_build.md)
3. **Setting up a device for testing?** See [System/demo_setup.md](System/demo_setup.md)
4. **Understanding the data layer?** Read [System/data_architecture.md](System/data_architecture.md)
5. **Checking implementation progress?** View [System/implementation_status.md](System/implementation_status.md)

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
| [SOP/live_activity_build.md](SOP/live_activity_build.md) | **Complete guide** for building & testing Live Activities, including widget extension setup, troubleshooting, and API reference |

**Recommended SOPs to create:**
- How to add a new screen/route
- How to add a database migration
- How to update the native bridge

---

## Project Summary

### What We're Building

A React Native/Expo iOS study timer app that displays a **Live Activity** on the iOS lock screen and **Dynamic Island**. The React Native app controls the timer; the native iOS Live Activity reflects its state in real-time.

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| Timer UI | iOS-native styled timer with circular buttons | **Complete** |
| Live Activity | Real-time timer on Lock Screen | **Complete** |
| Dynamic Island | Compact, minimal, expanded views | **Complete** |
| Session History | SQLite-persisted session records with stats | Planned |
| Edge Cases | Zombie cleanup, graceful degradation | **Complete** |

### Tech Stack

| Component | Technology | Status |
|-----------|------------|--------|
| Framework | React Native + Expo | Active |
| State | React Hooks (useTimer) | Active (Zustand planned) |
| Database | Supabase (PostgreSQL) | **Implemented** |
| Native Bridge | Expo Modules | **Implemented** |
| iOS Integration | ActivityKit (Swift/SwiftUI) | **Implemented** |

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

*Last updated: 2026-02-02*
