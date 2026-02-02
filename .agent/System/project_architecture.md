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

| Layer | Technology | Version | Purpose | Status |
|-------|------------|---------|---------|--------|
| **Framework** | React Native | 0.81.5 | Cross-platform mobile development | Active |
| **Platform Tools** | Expo SDK | 54.0.32 | Development tooling, native module support | Active |
| **Language (RN)** | TypeScript | 5.9.2 | Type-safe JavaScript | Active |
| **Language (iOS)** | Swift/SwiftUI | 5.9+ | Native iOS Live Activity implementation | Active |
| **State Management** | React Hooks | - | Timer state via useTimer hook | Active (Zustand planned) |
| **Cloud Database** | Supabase (PostgreSQL) | - | Session logging & cloud sync | **Implemented** |
| **Local Storage** | expo-secure-store | 15.0.8 | Device ID persistence (Keychain) | **Implemented** |
| **Native Bridge** | Expo Modules | Latest | React Native <-> Swift communication | **Implemented** |
| **iOS API** | ActivityKit | iOS 16.1+ | Live Activities & Dynamic Island | **Implemented** |

### Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.93.3",
    "expo": "~54.0.32",
    "expo-dev-client": "~6.0.20",
    "expo-secure-store": "~15.0.8",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5"
  }
}
```

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

## File Structure

### Current Implementation

```
timer/
├── App.tsx                         # Entry point - renders TimerScreen
│
├── src/
│   ├── screens/
│   │   └── TimerScreen.tsx         # Main timer screen ✅
│   ├── components/
│   │   └── Timer/
│   │       ├── TimerDisplay.tsx    # iOS-native HH:MM:SS display ✅
│   │       ├── TimerControls.tsx   # iOS circular buttons ✅
│   │       └── SessionInput.tsx    # iOS-style input ✅
│   ├── hooks/
│   │   └── useTimer.ts             # Timer + Live Activity + Supabase integration ✅
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client ✅
│   │   └── deviceId.ts             # Device ID utility ✅
│   ├── services/
│   │   └── sessionService.ts       # Session CRUD operations ✅
│   ├── types/
│   │   ├── timer.ts                # TypeScript interfaces ✅
│   │   └── database.ts             # Supabase TypeScript types ✅
│   └── utils/
│       └── time.ts                 # Time formatting ✅
│
├── modules/
│   └── live-activity/              # Expo Native Module ✅
│       ├── expo-module.config.json
│       ├── package.json
│       ├── ios/
│       │   ├── LiveActivityModule.swift  # ActivityKit bridge
│       │   └── StudyTimerAttributes.swift # ContentState definition (SOURCE OF TRUTH)
│       └── src/
│           ├── index.ts            # TypeScript API
│           └── LiveActivity.types.ts
│
├── plugins/
│   └── withLiveActivities.js       # Expo config plugin ✅
│
├── supabase/
│   └── migrations/                 # SQL migrations ✅
│       ├── 20260130000001_create_sessions_table.sql
│       └── 20260130000002_create_session_history_table.sql
│
├── ios/                            # GENERATED - do not commit
│   ├── StudyTimer/
│   │   ├── AppDelegate.swift
│   │   ├── Info.plist              # +NSSupportsLiveActivities (via plugin)
│   │   └── StudyTimerAttributes.swift  # Copy of ContentState ✅
│   ├── StudyTimerWidgetExtension/  # Widget Extension ✅
│   │   ├── Info.plist
│   │   ├── StudyTimerAttributes.swift  # Copy of ContentState (must match module)
│   │   ├── StudyTimerWidgetBundle.swift  # @main entry point
│   │   └── StudyTimerLiveActivity.swift  # SwiftUI views
│   ├── Podfile
│   └── StudyTimer.xcworkspace      # Open this in Xcode
│
├── .agent/                         # Documentation
├── .claude/                        # Claude Code config
├── app.json                        # +withLiveActivities plugin
├── package.json
└── tsconfig.json
```

### Planned Additions

```
timer/
├── app/                            # Expo Router screens (planned)
│   ├── _layout.tsx                 # Root layout with tabs
│   ├── index.tsx                   # Timer screen
│   ├── history.tsx                 # Session history
│   └── settings.tsx                # App settings
│
├── src/
│   ├── components/
│   │   ├── Timer/
│   │   │   └── DurationPresets.tsx # Quick duration buttons (planned)
│   │   └── History/
│   │       ├── SessionCard.tsx     # Session item (planned)
│   │       └── StatsCards.tsx      # Statistics (planned)
│   │
│   ├── store/                      # (planned)
│   │   └── timerStore.ts           # Zustand store
│   │
│   └── db/                         # (planned)
│       ├── database.ts             # SQLite initialization
│       ├── sessions.ts             # Session CRUD
│       └── history.ts              # History queries
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

### 2. useTimer <-> Supabase (Implemented)

All session data persists to Supabase cloud database:

```typescript
// src/services/sessionService.ts

startSession(title)  → createSession() INSERT into sessions
                     → logSessionEvent() INSERT 'started' + 'activity_started'
pauseSession()       → updateSessionStatus() UPDATE sessions.status='paused'
                     → logSessionEvent() INSERT 'paused'
resumeSession()      → updateSessionStatus() UPDATE sessions.status='active'
                     → logSessionEvent() INSERT 'resumed'
stopSession()        → updateSessionStatus() UPDATE sessions.status='completed', end_time
                     → logSessionEvent() INSERT 'stopped' + 'activity_ended'
```

**Device Identification:**
- `device_id` is generated once and stored in **expo-secure-store** (iOS Keychain)
- Survives app reinstalls (unlike AsyncStorage)
- Used to scope sessions per device for anonymous sync
- Future: Replace with user auth for cross-device sync

### 3. useTimer <-> Live Activity Module (Implemented)

Timer state syncs to Live Activity via Expo Native Module:

```typescript
// src/hooks/useTimer.ts integrates with modules/live-activity/

startSession(title)  → LiveActivity.startActivity(sessionId, title)
                      // Returns { success, activityId, startTime }

// NO per-second updates! SwiftUI Text(timerInterval:) handles auto-counting

pauseSession()       → LiveActivity.updateActivity(accumulatedSeconds, true)
                      // Shows static time, sets isPaused = true

resumeSession()      → LiveActivity.updateActivity(accumulatedSeconds, false, newSegmentStartTime)
                      // Resumes auto-updating timer

stopSession()        → LiveActivity.endActivity()

// Cleanup
mount              → LiveActivity.endAllActivities()  // zombie prevention
unmount            → LiveActivity.endActivity()
```

**ContentState Fields:**
- `startDate: Date` - When current running segment started
- `accumulatedSeconds: Int` - Total accumulated time
- `isPaused: Bool` - Controls timer vs static display
- `timerInterval` (computed) - For SwiftUI `Text(timerInterval:)`

### 4. Native Bridge <-> ActivityKit (Implemented)

Swift module manages iOS system integration:

```swift
// modules/live-activity/ios/LiveActivityModule.swift

isSupported()                       → ActivityAuthorizationInfo().areActivitiesEnabled
startActivity(sessionId, title)     → Activity.request(attributes:content:)
                                     // Stores sessionStartDate for timing
updateActivity(accumulatedSeconds,  → activity.update(ActivityContent(state:))
              isPaused, startTime?) // startTime as JS timestamp (ms)
endActivity()                       → activity.end(dismissalPolicy: .immediate)
endAllActivities()                  → Activity.activities.forEach { $0.end() }
```

**Key Implementation Details:**
- Uses `@available(iOS 16.2, *)` checks
- Stores `sessionStartDate` for accurate timer calculations
- Converts JS timestamps to Swift `Date` (divide by 1000)
- Falls back gracefully on unsupported devices

### 5. Widget Extension (Implemented)

SwiftUI views for Lock Screen and Dynamic Island:

```
ios/StudyTimerWidgetExtension/
├── StudyTimerLiveActivity.swift
│   ├── LockScreenView         # Full lock screen widget
│   ├── DynamicIslandCompact   # Compact leading + trailing
│   ├── DynamicIslandExpanded  # Full expanded view
│   └── DynamicIslandMinimal   # Single icon
└── StudyTimerAttributes.swift # Shared with main app
```

---

## UI Design System

The app uses iOS-native styling patterns to match SwiftUI/UIKit conventions.

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| **Primary Green** | `#30D158` | Start, Resume buttons |
| **Warning Orange** | `#FF9F0A` | Pause button |
| **Destructive Red** | `#FF3B30` | Stop button |
| **Secondary Gray** | `#8E8E93` | Labels, placeholders |
| **Grouped Background** | `#F2F2F7` | Input fields |
| **Disabled Background** | `#E5E5EA` | Disabled states |

### Typography

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Timer Display | 76pt | 100 (Ultralight) | System font, tabular-nums |
| Section Label | 13pt | 500 (Medium) | Uppercase, letter-spacing |
| Input Text | 17pt | 400 (Regular) | iOS body size |
| Button Text | 16pt | 500 (Medium) | Circular buttons |

### Components

**Circular Buttons** (iOS Clock app style)
- 84pt diameter with double-ring design
- Outer 2pt border ring
- Inner filled circle (78pt)
- Color-coded by action

**Session Input** (iOS Settings style)
- Uppercase "SESSION" label
- Rounded rect with `#F2F2F7` background
- No border (cleaner iOS look)

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

### Quick Start (Existing Project)

```bash
# Install dependencies
npm install

# Build and run on connected device
npx expo run:ios --device
```

### Full Rebuild (After Major Changes)

```bash
# 1. Clean everything
rm -rf ios android node_modules

# 2. Reinstall dependencies
npm install

# 3. Generate native projects (plugin auto-creates widget extension files)
npx expo prebuild --clean

# 4. Build and run
npx expo run:ios --device  # iOS (Live Activities require physical device)
npx expo run:android       # Android (no Live Activities)
```

**Note:** The `withLiveActivities.js` plugin now auto-generates all widget extension files during prebuild. If the widget extension doesn't compile, you may need to manually add the Swift files to the "Compile Sources" build phase in Xcode.

### Development Server (Simulator Only)

```bash
# Start Metro bundler (no native features)
npx expo start

# For Live Activities, MUST use physical device
npx expo run:ios --device
```

### Xcode Direct Build

```bash
# Open workspace in Xcode
open ios/StudyTimer.xcworkspace

# Then: Select device → Product → Run (⌘R)
```

### EAS Cloud Build

```bash
# Build development build
eas build --profile development --platform ios

# Build for TestFlight
eas build --profile preview --platform ios
```

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [data_architecture.md](data_architecture.md) | Detailed SQLite schema, data flows, state management |
| [demo_setup.md](demo_setup.md) | Physical iPhone testing guide |
| [../Wireframes/](../Wireframes/) | UI mockups for all screens |

---

## Android Support

Android builds are supported but **Live Activities are iOS-only**. The timer functionality works on Android; the `LiveActivity` module calls gracefully no-op.

### Android Setup Requirements

```bash
# Environment variables (~/.zshrc)
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Create local.properties (auto-generated, or manual)
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### Android Build

```bash
# Start emulator from Android Studio Virtual Device Manager, then:
npx expo run:android
```

---

*Last updated: 2026-02-02*
