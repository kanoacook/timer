# Project Architecture - Study Timer iOS App

## Overview

A React Native/Expo iOS study timer application that displays a Live Activity on the iOS lock screen and Dynamic Island. The React Native app controls the timer while the native iOS Live Activity reflects its state in real-time.

---

## Project Goal

Build a focus/study timer that:
1. Provides a native iOS experience with timer controls
2. Shows real-time timer status on Lock Screen and Dynamic Island via Live Activities
3. Persists session history locally using SQLite
4. Handles app lifecycle gracefully (background, foreground, killed)

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | React Native | Latest | Cross-platform mobile development |
| **Platform Tools** | Expo SDK | 52+ | Development tooling, native module support |
| **Language (RN)** | TypeScript | 5.x | Type-safe JavaScript |
| **Language (iOS)** | Swift/SwiftUI | 5.9+ | Native iOS Live Activity implementation |
| **State Management** | Zustand | 4.x | Lightweight global state |
| **Local Database** | expo-sqlite | Latest | Persistent session storage |
| **Native Bridge** | Expo Modules | Latest | React Native <-> Swift communication |
| **iOS API** | ActivityKit | iOS 16.1+ | Live Activities & Dynamic Island |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STUDY TIMER APP                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     REACT NATIVE LAYER                          │   │
│  │                                                                  │   │
│  │   ┌────────────────────────────────────────────────────────┐    │   │
│  │   │                    UI COMPONENTS                        │    │   │
│  │   │   TimerScreen  │  HistoryScreen  │  SettingsScreen     │    │   │
│  │   └───────────────────────────┬────────────────────────────┘    │   │
│  │                               │                                  │   │
│  │   ┌───────────────────────────┴────────────────────────────┐    │   │
│  │   │              STATE MANAGEMENT (Zustand)                 │    │   │
│  │   │   useTimerStore: session, elapsed, status, actions      │    │   │
│  │   └───────────────────────────┬────────────────────────────┘    │   │
│  │                               │                                  │   │
│  │         ┌─────────────────────┼─────────────────────┐           │   │
│  │         ▼                     ▼                     ▼           │   │
│  │   ┌───────────┐       ┌──────────────┐       ┌───────────┐     │   │
│  │   │  SQLite   │       │ Timer Logic  │       │  Native   │     │   │
│  │   │  (CRUD)   │       │  (interval)  │       │  Bridge   │     │   │
│  │   └─────┬─────┘       └──────────────┘       └─────┬─────┘     │   │
│  │         │                                          │            │   │
│  └─────────┼──────────────────────────────────────────┼────────────┘   │
│            │                                          │                 │
│            ▼                                          ▼                 │
│   ┌────────────────┐                      ┌────────────────────────┐   │
│   │  timer.db      │                      │   SWIFT NATIVE MODULE  │   │
│   │  ├─ sessions   │                      │   ├─ startActivity()   │   │
│   │  └─ history    │                      │   ├─ updateActivity()  │   │
│   └────────────────┘                      │   └─ endActivity()     │   │
│                                           └───────────┬────────────┘   │
│                                                       │                 │
├───────────────────────────────────────────────────────┼─────────────────┤
│                         iOS SYSTEM LAYER              │                 │
│                                                       ▼                 │
│                                           ┌────────────────────────┐   │
│                                           │      ActivityKit       │   │
│                                           │   ┌────────────────┐   │   │
│                                           │   │ Dynamic Island │   │   │
│                                           │   │ Lock Screen    │   │   │
│                                           │   └────────────────┘   │   │
│                                           └────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure (Planned)

```
timer/
├── .agent/                         # Documentation & planning
│   ├── README.md                   # Documentation index
│   ├── System/                     # Architecture docs
│   ├── Tasks/                      # Feature PRDs
│   ├── SOP/                        # Standard procedures
│   └── Wireframes/                 # UI mockups
│
├── .claude/                        # Claude Code configuration
│   ├── CLAUDE.md                   # Project instructions
│   ├── agents/                     # Agent definitions
│   ├── commands/                   # Custom commands
│   └── Tasks/                      # Session contexts
│
├── app/                            # Expo Router screens
│   ├── _layout.tsx                 # Root layout with tabs
│   ├── index.tsx                   # Timer screen (main)
│   ├── history.tsx                 # Session history
│   └── settings.tsx                # App settings
│
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── Timer/
│   │   │   ├── TimerDisplay.tsx    # Circular timer UI
│   │   │   ├── TimerControls.tsx   # Start/Pause/Stop buttons
│   │   │   └── DurationPresets.tsx # Quick duration buttons
│   │   └── History/
│   │       ├── SessionCard.tsx     # Individual session item
│   │       └── StatsCards.tsx      # Statistics display
│   │
│   ├── store/
│   │   └── timerStore.ts           # Zustand store definition
│   │
│   ├── db/
│   │   ├── database.ts             # SQLite initialization
│   │   ├── sessions.ts             # Session CRUD operations
│   │   └── history.ts              # History queries
│   │
│   ├── modules/
│   │   └── TimerLiveActivity.ts    # Native bridge TypeScript interface
│   │
│   ├── hooks/
│   │   ├── useTimer.ts             # Timer logic hook
│   │   └── useDatabase.ts          # Database hook
│   │
│   └── utils/
│       ├── time.ts                 # Time formatting utilities
│       └── uuid.ts                 # UUID generation
│
├── ios/
│   ├── timer/                      # Main app target
│   │   ├── AppDelegate.swift
│   │   └── Info.plist
│   │
│   ├── Modules/                    # Expo Native Modules
│   │   └── TimerLiveActivity/
│   │       ├── TimerLiveActivityModule.swift
│   │       ├── TimerActivityAttributes.swift
│   │       └── expo-module.config.json
│   │
│   └── timerWidget/                # Widget Extension
│       ├── timerWidgetBundle.swift
│       ├── timerWidgetLiveActivity.swift
│       └── Info.plist
│
├── plugins/                        # Expo config plugins
│   └── withLiveActivities.js       # Info.plist configuration
│
├── app.json                        # Expo configuration
├── eas.json                        # EAS Build configuration
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── README.md                       # Project overview
```

---

## Key Integration Points

### 1. React Native <-> Zustand Store

The Zustand store is the central state hub:

```typescript
// Actions trigger state updates
startSession(title) → updates currentSession, timerStatus
pauseSession()      → updates timerStatus, saves to SQLite
stopSession()       → clears session, ends Live Activity
```

### 2. Zustand <-> SQLite

All session data persists to SQLite:

```
startSession  → INSERT into sessions
pauseSession  → UPDATE sessions.status + INSERT history event
stopSession   → UPDATE sessions.end_time, status
loadHistory   → SELECT from sessions WHERE status='completed'
```

### 3. Zustand <-> Native Bridge

Timer state syncs to Live Activity:

```
startSession  → TimerLiveActivity.startActivity()
tick()        → TimerLiveActivity.updateActivity() (throttled)
pauseSession  → TimerLiveActivity.updateActivity(isPaused: true)
stopSession   → TimerLiveActivity.endActivity()
```

### 4. Native Bridge <-> ActivityKit

Swift module manages iOS system integration:

```swift
startActivity()  → Activity.request(attributes:content:)
updateActivity() → activity.update(content:)
endActivity()    → activity.end(dismissalPolicy:)
```

---

## Development Requirements

### Hardware
- Mac with Apple Silicon or Intel (macOS 13.0+)
- iPhone with iOS 16.1+ for Live Activity testing
- iPhone 14 Pro+ for Dynamic Island testing

### Software
- Xcode 15.0+
- Node.js 18+
- Expo CLI (via npx)
- EAS CLI
- Apple Developer Account (paid)

---

## Build & Run Commands

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Generate native project
npx expo prebuild --platform ios

# Run on device from Xcode
open ios/*.xcworkspace

# Build with EAS
eas build --profile development --platform ios
```

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [data_architecture.md](data_architecture.md) | Detailed SQLite schema, data flows, state management |
| [demo_setup.md](demo_setup.md) | Physical iPhone testing guide |
| [../Wireframes/](../Wireframes/) | UI mockups for all screens |

---

*Last updated: 2026-01-30*
