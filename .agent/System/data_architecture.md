# Data Architecture - Study Timer iOS App

## Overview

This document defines the complete data architecture for the Study Timer iOS application, including SQLite schema design, data flow between layers, state management patterns, and the React Native to Swift native bridge design for Live Activities (Dynamic Island).

---

## 1. SQLite Schema Design

### Entity Relationship Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STUDY TIMER DATABASE                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐         ┌─────────────────────────────────────┐
│       sessions          │         │         session_history             │
├─────────────────────────┤         ├─────────────────────────────────────┤
│ id (PK, TEXT, UUID)     │────────>│ id (PK, TEXT, UUID)                 │
│ title (TEXT, NOT NULL)  │         │ session_id (FK, TEXT, NOT NULL)     │
│ duration_seconds (INT)  │         │ event_type (TEXT, NOT NULL)         │
│ start_time (TEXT, ISO)  │         │ event_time (TEXT, ISO8601)          │
│ end_time (TEXT, ISO)    │         │ elapsed_at_event (INT)              │
│ status (TEXT)           │         │ metadata (TEXT, JSON)               │
│ created_at (TEXT, ISO)  │         │ created_at (TEXT, ISO8601)          │
│ updated_at (TEXT, ISO)  │         └─────────────────────────────────────┘
│ is_synced (INT, 0/1)    │
└─────────────────────────┘

Legend:
  PK = Primary Key
  FK = Foreign Key
  TEXT = SQLite Text type (ISO8601 for dates)
  INT = SQLite Integer type
```

### Table Definitions

#### `sessions` Table

Primary table for storing study sessions (both active and completed).

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    start_time TEXT NOT NULL,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_synced INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY, NOT NULL | UUID v4 generated on session creation |
| `title` | TEXT | NOT NULL | User-provided session name (e.g., "Chapter 5 Review") |
| `duration_seconds` | INTEGER | DEFAULT 0 | Total elapsed seconds (updated on pause/stop) |
| `start_time` | TEXT | NOT NULL | ISO8601 timestamp when session started |
| `end_time` | TEXT | NULL | ISO8601 timestamp when session ended (NULL if active) |
| `status` | TEXT | NOT NULL, DEFAULT 'active' | Enum: 'active', 'paused', 'completed', 'cancelled' |
| `created_at` | TEXT | NOT NULL | ISO8601 timestamp of record creation |
| `updated_at` | TEXT | NOT NULL | ISO8601 timestamp of last update |
| `is_synced` | INTEGER | DEFAULT 0 | Future-proofing for cloud sync (0=false, 1=true) |

**Status Values:**
- `active` - Timer is currently running
- `paused` - Timer is paused, can be resumed
- `completed` - Timer was stopped normally
- `cancelled` - Session was abandoned/deleted

#### `session_history` Table

Event log for tracking all state changes within a session (audit trail + analytics).

```sql
CREATE TABLE IF NOT EXISTS session_history (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_time TEXT NOT NULL DEFAULT (datetime('now')),
    elapsed_at_event INTEGER DEFAULT 0,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_history_session_id ON session_history(session_id);
CREATE INDEX IF NOT EXISTS idx_history_event_type ON session_history(event_type);
CREATE INDEX IF NOT EXISTS idx_history_event_time ON session_history(event_time DESC);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY, NOT NULL | UUID v4 for each event |
| `session_id` | TEXT | FK, NOT NULL | Reference to parent session |
| `event_type` | TEXT | NOT NULL | Event type (see below) |
| `event_time` | TEXT | NOT NULL | ISO8601 timestamp of event |
| `elapsed_at_event` | INTEGER | DEFAULT 0 | Elapsed seconds at time of event |
| `metadata` | TEXT | NULL | JSON blob for event-specific data |
| `created_at` | TEXT | NOT NULL | ISO8601 timestamp of record creation |

**Event Types:**
- `started` - Session began
- `paused` - Timer paused
- `resumed` - Timer resumed from pause
- `stopped` - Session completed
- `activity_started` - Live Activity was created
- `activity_updated` - Live Activity was updated
- `activity_ended` - Live Activity was dismissed

### Sample Queries

```sql
-- Get active session (should only be one at a time)
SELECT * FROM sessions WHERE status IN ('active', 'paused') LIMIT 1;

-- Get recent completed sessions (for history view)
SELECT * FROM sessions
WHERE status = 'completed'
ORDER BY end_time DESC
LIMIT 20;

-- Calculate total study time today
SELECT SUM(duration_seconds) as total_seconds
FROM sessions
WHERE status = 'completed'
AND date(end_time) = date('now');

-- Get session with its event history
SELECT s.*, h.event_type, h.event_time, h.elapsed_at_event
FROM sessions s
LEFT JOIN session_history h ON s.id = h.session_id
WHERE s.id = ?
ORDER BY h.event_time ASC;

-- Statistics: Average session duration
SELECT
    AVG(duration_seconds) as avg_duration,
    COUNT(*) as total_sessions,
    SUM(duration_seconds) as total_time
FROM sessions
WHERE status = 'completed';
```

---

## 2. Data Flow Diagram

### Complete System Data Flow (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              STUDY TIMER APP                                     │
│                            Data Flow Architecture                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          REACT NATIVE LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         UI COMPONENTS                                    │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │    │
│  │  │ TimerScreen  │  │ HistoryScreen│  │ SessionInput │                   │    │
│  │  │              │  │              │  │              │                   │    │
│  │  │ - Display    │  │ - List past  │  │ - Title      │                   │    │
│  │  │   elapsed    │  │   sessions   │  │   input      │                   │    │
│  │  │ - Controls   │  │ - Stats view │  │ - Start btn  │                   │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │    │
│  │         │                 │                 │                            │    │
│  │         └─────────────────┼─────────────────┘                            │    │
│  │                           │                                              │    │
│  │                           ▼                                              │    │
│  └───────────────────────────┼──────────────────────────────────────────────┘    │
│                              │                                                   │
│  ┌───────────────────────────┼──────────────────────────────────────────────┐    │
│  │                    STATE MANAGEMENT (Zustand)                             │    │
│  │  ┌────────────────────────┴─────────────────────────────────────────┐    │    │
│  │  │                     useTimerStore                                 │    │    │
│  │  │  ┌─────────────────────────────────────────────────────────────┐ │    │    │
│  │  │  │ State:                                                       │ │    │    │
│  │  │  │  - currentSession: Session | null                           │ │    │    │
│  │  │  │  - timerStatus: 'idle' | 'running' | 'paused'              │ │    │    │
│  │  │  │  - elapsedSeconds: number                                   │ │    │    │
│  │  │  │  - sessionHistory: Session[]                                │ │    │    │
│  │  │  │  - isLiveActivityActive: boolean                            │ │    │    │
│  │  │  └─────────────────────────────────────────────────────────────┘ │    │    │
│  │  │  ┌─────────────────────────────────────────────────────────────┐ │    │    │
│  │  │  │ Actions:                                                     │ │    │    │
│  │  │  │  - startSession(title: string)                              │ │    │    │
│  │  │  │  - pauseSession()                                           │ │    │    │
│  │  │  │  - resumeSession()                                          │ │    │    │
│  │  │  │  - stopSession()                                            │ │    │    │
│  │  │  │  - loadHistory()                                            │ │    │    │
│  │  │  └─────────────────────────────────────────────────────────────┘ │    │    │
│  │  └──────────────────────────┬───────────────────────────────────────┘    │    │
│  │                             │                                            │    │
│  └─────────────────────────────┼────────────────────────────────────────────┘    │
│                                │                                                 │
│         ┌──────────────────────┼──────────────────────┐                          │
│         │                      │                      │                          │
│         ▼                      ▼                      ▼                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│  │ Database Layer  │    │  Timer Service  │    │ Native Bridge   │              │
│  │ (expo-sqlite)   │    │  (JS Interval)  │    │ (Expo Module)   │              │
│  │                 │    │                 │    │                 │              │
│  │ - openDatabase  │    │ - setInterval   │    │ - startTimer()  │              │
│  │ - runAsync()    │    │ - tick handler  │    │ - pauseTimer()  │              │
│  │ - getFirstAsync │    │ - background    │    │ - stopTimer()   │              │
│  │ - getAllAsync   │    │   task mgmt     │    │ - updateTimer() │              │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘              │
│           │                      │                      │                        │
└───────────┼──────────────────────┼──────────────────────┼────────────────────────┘
            │                      │                      │
            ▼                      │                      ▼
┌───────────────────────┐          │         ┌─────────────────────────────────────┐
│     SQLite Database   │          │         │          SWIFT NATIVE MODULE        │
│                       │          │         │                                     │
│  ┌─────────────────┐  │          │         │  ┌─────────────────────────────┐   │
│  │    sessions     │  │          │         │  │   StudyTimerModule.swift    │   │
│  │    (table)      │  │          │         │  │                             │   │
│  └─────────────────┘  │          │         │  │  - startTimer(...)          │   │
│  ┌─────────────────┐  │          │         │  │  - pauseTimer(...)          │   │
│  │ session_history │  │          │         │  │  - resumeTimer(...)         │   │
│  │    (table)      │  │          │         │  │  - stopTimer()              │   │
│  └─────────────────┘  │          │         │  │  - updateActivity(...)      │   │
│                       │          │         │  │                             │   │
│  File: timer.db       │          │         │  └─────────────┬───────────────┘   │
└───────────────────────┘          │         │                │                   │
                                   │         │                ▼                   │
                                   │         │  ┌─────────────────────────────┐   │
                                   │         │  │   ActivityKit Integration   │   │
                                   └─────────│──│                             │   │
                                             │  │  - Activity<TimerAttributes>│   │
                                             │  │  - ContentState             │   │
                                             │  │  - request/update/end       │   │
                                             │  └─────────────┬───────────────┘   │
                                             │                │                   │
                                             └────────────────┼───────────────────┘
                                                              │
                                                              ▼
                                             ┌────────────────────────────────────┐
                                             │         iOS SYSTEM LAYER           │
                                             │                                    │
                                             │  ┌──────────────────────────────┐  │
                                             │  │        LIVE ACTIVITY         │  │
                                             │  │                              │  │
                                             │  │  ┌────────────────────────┐  │  │
                                             │  │  │    Lock Screen View    │  │  │
                                             │  │  │  📚 Chapter 5  01:23:45│  │  │
                                             │  │  │  ━━━━━━━━━━━━━━━━━━━━ │  │  │
                                             │  │  └────────────────────────┘  │  │
                                             │  │                              │  │
                                             │  │  ┌────────────────────────┐  │  │
                                             │  │  │   Dynamic Island       │  │  │
                                             │  │  │  (Compact/Expanded)    │  │  │
                                             │  │  └────────────────────────┘  │  │
                                             │  │                              │  │
                                             │  └──────────────────────────────┘  │
                                             │                                    │
                                             └────────────────────────────────────┘
```

### Data Flow Sequence - Start Session

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐    ┌─────────────┐
│    UI    │    │  Zustand  │    │  SQLite  │    │  Native   │    │ ActivityKit │
│          │    │   Store   │    │    DB    │    │  Module   │    │             │
└────┬─────┘    └─────┬─────┘    └────┬─────┘    └─────┬─────┘    └──────┬──────┘
     │                │               │                │                 │
     │ 1. User taps   │               │                │                 │
     │    "Start"     │               │                │                 │
     │───────────────>│               │                │                 │
     │                │               │                │                 │
     │                │ 2. INSERT     │                │                 │
     │                │    session    │                │                 │
     │                │──────────────>│                │                 │
     │                │               │                │                 │
     │                │<──────────────│                │                 │
     │                │  session_id   │                │                 │
     │                │               │                │                 │
     │                │ 3. startTimer(sessionId,      │                 │
     │                │    title, startTime)          │                 │
     │                │───────────────────────────────>│                 │
     │                │               │                │                 │
     │                │               │                │ 4. Activity     │
     │                │               │                │    .request()   │
     │                │               │                │────────────────>│
     │                │               │                │                 │
     │                │               │                │<────────────────│
     │                │               │                │   activityId    │
     │                │<──────────────────────────────-│                 │
     │                │  { success, activityId }       │                 │
     │                │               │                │                 │
     │                │ 5. Update     │                │                 │
     │                │    state      │                │                 │
     │<───────────────│               │                │                 │
     │  re-render     │               │                │                 │
     │                │               │                │                 │
```

### Data Flow Sequence - Timer Tick (Background)

```
┌───────────┐    ┌──────────┐    ┌───────────┐    ┌─────────────┐
│  Timer    │    │  Zustand │    │  Native   │    │ ActivityKit │
│ Interval  │    │   Store  │    │  Module   │    │             │
└─────┬─────┘    └────┬─────┘    └─────┬─────┘    └──────┬──────┘
      │               │                │                 │
      │ 1. tick       │                │                 │
      │   (1 sec)     │                │                 │
      │──────────────>│                │                 │
      │               │                │                 │
      │               │ 2. elapsed++   │                 │
      │               │                │                 │
      │               │ 3. updateTimer │                 │
      │               │   (elapsed)    │                 │
      │               │───────────────>│                 │
      │               │                │                 │
      │               │                │ 4. Activity     │
      │               │                │   .update()     │
      │               │                │────────────────>│
      │               │                │                 │
      │               │                │<────────────────│
      │               │<───────────────│                 │
      │               │                │                 │

Note: Update frequency to ActivityKit is throttled to every
1-2 seconds to comply with system limits.
```

---

## 3. State Management Architecture

### Zustand Store Design

```typescript
// src/store/timerStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Session {
  id: string;
  title: string;
  durationSeconds: number;
  startTime: string;      // ISO8601
  endTime: string | null; // ISO8601
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface TimerState {
  // Current session state
  currentSession: Session | null;
  timerStatus: TimerStatus;
  elapsedSeconds: number;

  // Live Activity state
  isLiveActivityActive: boolean;
  liveActivityId: string | null;

  // History
  sessionHistory: Session[];

  // Loading states
  isLoading: boolean;
  error: string | null;
}

export interface TimerActions {
  // Session lifecycle
  startSession: (title: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<void>;

  // Timer tick (called by interval)
  tick: () => void;

  // Data operations
  loadHistory: () => Promise<void>;
  loadActiveSession: () => Promise<void>;

  // Internal setters
  setElapsedSeconds: (seconds: number) => void;
  setLiveActivityState: (isActive: boolean, activityId: string | null) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

type TimerStore = TimerState & TimerActions;

const initialState: TimerState = {
  currentSession: null,
  timerStatus: 'idle',
  elapsedSeconds: 0,
  isLiveActivityActive: false,
  liveActivityId: null,
  sessionHistory: [],
  isLoading: false,
  error: null,
};

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startSession: async (title: string) => {
        // Implementation calls DB + Native Module
        // See implementation section below
      },

      pauseSession: async () => {
        // Update DB status, update Live Activity
      },

      resumeSession: async () => {
        // Update DB status, update Live Activity
      },

      stopSession: async () => {
        // Update DB, end Live Activity
      },

      tick: () => {
        const { timerStatus, elapsedSeconds } = get();
        if (timerStatus === 'running') {
          set({ elapsedSeconds: elapsedSeconds + 1 });
        }
      },

      loadHistory: async () => {
        // Query completed sessions from DB
      },

      loadActiveSession: async () => {
        // Check for active/paused session on app launch
      },

      setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),

      setLiveActivityState: (isActive, activityId) => set({
        isLiveActivityActive: isActive,
        liveActivityId: activityId,
      }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'timer-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist minimal state for app restart recovery
      partialize: (state) => ({
        currentSession: state.currentSession,
        elapsedSeconds: state.elapsedSeconds,
        timerStatus: state.timerStatus,
      }),
    }
  )
);
```

### State Synchronization Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STATE SYNC ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      SOURCE OF TRUTH                                │
│                                                                     │
│   ┌─────────────┐                    ┌─────────────────────────┐   │
│   │   SQLite    │  <-- Persistent    │   Zustand Store         │   │
│   │   Database  │      Truth for     │   (In-Memory)           │   │
│   │             │      Sessions      │                         │   │
│   │  - sessions │                    │  - currentSession       │   │
│   │  - history  │                    │  - elapsedSeconds       │   │
│   │             │                    │  - timerStatus          │   │
│   └─────────────┘                    └─────────────────────────┘   │
│         │                                      │                    │
│         │   On App Launch: Load from DB ──────>│                    │
│         │<── On State Change: Persist ─────────│                    │
│         │                                      │                    │
└─────────┼──────────────────────────────────────┼────────────────────┘
          │                                      │
          │                                      │
┌─────────┼──────────────────────────────────────┼────────────────────┐
│         │         LIVE ACTIVITY SYNC           │                    │
│         │                                      │                    │
│         │    ┌─────────────────────────────────┘                    │
│         │    │                                                      │
│         │    │  Every 1-2 seconds:                                  │
│         │    │  Zustand.elapsedSeconds ──> Native Module ──>        │
│         │    │                             ActivityKit.update()     │
│         │    │                                                      │
│         │    │  On Status Change:                                   │
│         │    │  Zustand.timerStatus ──> Native Module ──>           │
│         │    │                          ActivityKit (pause icon)    │
│         │    │                                                      │
└─────────┼────┼──────────────────────────────────────────────────────┘
          │    │
          │    │
┌─────────┴────┴──────────────────────────────────────────────────────┐
│                    APP LIFECYCLE HANDLING                            │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ App Launch:                                                    │  │
│  │   1. Load persisted Zustand state (AsyncStorage)              │  │
│  │   2. Query SQLite for active session                          │  │
│  │   3. Reconcile: DB is truth, update Zustand if mismatch       │  │
│  │   4. If active session exists, restart timer interval         │  │
│  │   5. Check if Live Activity still exists, recreate if needed  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ App Background:                                                │  │
│  │   1. Persist current elapsed to SQLite                        │  │
│  │   2. Live Activity continues showing (system managed)         │  │
│  │   3. Timer interval paused by OS                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ App Foreground:                                                │  │
│  │   1. Calculate actual elapsed from startTime                  │  │
│  │   2. Update Zustand with correct elapsed                      │  │
│  │   3. Resume timer interval                                    │  │
│  │   4. Update Live Activity with correct time                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ App Killed:                                                    │  │
│  │   1. SQLite has last known state                              │  │
│  │   2. Live Activity ends gracefully (or shows stale)           │  │
│  │   3. On next launch, recover from SQLite                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Native Bridge Design

### TypeScript Interface (React Native Side)

```typescript
// src/modules/StudyTimerModule.ts

import { NativeModules, NativeEventEmitter } from 'react-native';

const { StudyTimerModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(StudyTimerModule);

// Types
export interface StartTimerParams {
  sessionId: string;
  title: string;
  startTime: string;  // ISO8601
}

export interface UpdateTimerParams {
  elapsedSeconds: number;
  isPaused: boolean;
}

export interface TimerResult {
  success: boolean;
  activityId?: string;
  error?: string;
}

// Event types
export interface ActivityEvent {
  type: 'started' | 'updated' | 'ended' | 'error';
  activityId?: string;
  error?: string;
}

// Module interface
interface IStudyTimerModule {
  /**
   * Start a new Live Activity for the timer
   * Creates Dynamic Island and Lock Screen widget
   */
  startTimer(params: StartTimerParams): Promise<TimerResult>;

  /**
   * Pause the current timer
   * Updates Live Activity to show paused state
   */
  pauseTimer(sessionId: string): Promise<TimerResult>;

  /**
   * Resume a paused timer
   * Updates Live Activity to show running state
   */
  resumeTimer(sessionId: string, elapsedSeconds: number): Promise<TimerResult>;

  /**
   * Stop the timer and end the Live Activity
   */
  stopTimer(sessionId: string): Promise<TimerResult>;

  /**
   * Update the Live Activity with current elapsed time
   * Call this every 1-2 seconds while timer is running
   */
  updateActivity(params: UpdateTimerParams): Promise<TimerResult>;

  /**
   * Check if there's an active Live Activity
   * Useful for app launch recovery
   */
  hasActiveActivity(): Promise<boolean>;

  /**
   * Get the current activity ID if one exists
   */
  getActiveActivityId(): Promise<string | null>;

  /**
   * Force end all activities (cleanup)
   */
  endAllActivities(): Promise<void>;
}

// Export typed module
export const StudyTimer: IStudyTimerModule = StudyTimerModule;

// Event subscription helper
export const subscribeToActivityEvents = (
  callback: (event: ActivityEvent) => void
): (() => void) => {
  const subscription = eventEmitter.addListener('onActivityEvent', callback);
  return () => subscription.remove();
};
```

### Swift Native Module (iOS Side)

```swift
// ios/StudyTimerModule/StudyTimerModule.swift

import Foundation
import ActivityKit
import React

@objc(StudyTimerModule)
class StudyTimerModule: RCTEventEmitter {

    // MARK: - Properties
    private var currentActivity: Activity<StudyTimerAttributes>?
    private var hasListeners = false

    // MARK: - RCTEventEmitter Setup
    override func supportedEvents() -> [String]! {
        return ["onActivityEvent"]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    // MARK: - Module Methods

    /// Start a new Live Activity
    @objc(startTimer:resolver:rejecter:)
    func startTimer(
        _ params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            resolve([
                "success": false,
                "error": "Live Activities are not enabled"
            ])
            return
        }

        guard let sessionId = params["sessionId"] as? String,
              let title = params["title"] as? String,
              let startTime = params["startTime"] as? String else {
            resolve([
                "success": false,
                "error": "Invalid parameters"
            ])
            return
        }

        // End any existing activity first
        Task {
            await self.endAllActivitiesInternal()

            // Create attributes and initial state
            let attributes = StudyTimerAttributes(
                sessionId: sessionId,
                title: title,
                startTime: startTime
            )

            let initialState = StudyTimerAttributes.ContentState(
                elapsedSeconds: 0,
                isPaused: false
            )

            let content = ActivityContent(
                state: initialState,
                staleDate: nil
            )

            do {
                let activity = try Activity.request(
                    attributes: attributes,
                    content: content,
                    pushType: nil // No push updates for this implementation
                )

                self.currentActivity = activity

                self.sendEvent(withName: "onActivityEvent", body: [
                    "type": "started",
                    "activityId": activity.id
                ])

                resolve([
                    "success": true,
                    "activityId": activity.id
                ])
            } catch {
                resolve([
                    "success": false,
                    "error": error.localizedDescription
                ])
            }
        }
    }

    /// Pause the timer
    @objc(pauseTimer:resolver:rejecter:)
    func pauseTimer(
        _ sessionId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivity else {
            resolve(["success": false, "error": "No active activity"])
            return
        }

        Task {
            let updatedState = StudyTimerAttributes.ContentState(
                elapsedSeconds: activity.content.state.elapsedSeconds,
                isPaused: true
            )

            await activity.update(
                ActivityContent(state: updatedState, staleDate: nil)
            )

            resolve(["success": true])
        }
    }

    /// Resume the timer
    @objc(resumeTimer:elapsedSeconds:resolver:rejecter:)
    func resumeTimer(
        _ sessionId: String,
        elapsedSeconds: Int,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivity else {
            resolve(["success": false, "error": "No active activity"])
            return
        }

        Task {
            let updatedState = StudyTimerAttributes.ContentState(
                elapsedSeconds: elapsedSeconds,
                isPaused: false
            )

            await activity.update(
                ActivityContent(state: updatedState, staleDate: nil)
            )

            resolve(["success": true])
        }
    }

    /// Stop the timer and end activity
    @objc(stopTimer:resolver:rejecter:)
    func stopTimer(
        _ sessionId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        Task {
            await self.endAllActivitiesInternal()
            resolve(["success": true])
        }
    }

    /// Update activity with current elapsed time
    @objc(updateActivity:resolver:rejecter:)
    func updateActivity(
        _ params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivity,
              let elapsedSeconds = params["elapsedSeconds"] as? Int,
              let isPaused = params["isPaused"] as? Bool else {
            resolve(["success": false, "error": "Invalid parameters or no activity"])
            return
        }

        Task {
            let updatedState = StudyTimerAttributes.ContentState(
                elapsedSeconds: elapsedSeconds,
                isPaused: isPaused
            )

            await activity.update(
                ActivityContent(state: updatedState, staleDate: nil)
            )

            resolve(["success": true])
        }
    }

    /// Check for active activity
    @objc(hasActiveActivity:rejecter:)
    func hasActiveActivity(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(currentActivity != nil)
    }

    /// Get active activity ID
    @objc(getActiveActivityId:rejecter:)
    func getActiveActivityId(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(currentActivity?.id)
    }

    /// End all activities
    @objc(endAllActivities:rejecter:)
    func endAllActivities(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        Task {
            await self.endAllActivitiesInternal()
            resolve(nil)
        }
    }

    // MARK: - Private Helpers

    private func endAllActivitiesInternal() async {
        for activity in Activity<StudyTimerAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        currentActivity = nil

        if hasListeners {
            sendEvent(withName: "onActivityEvent", body: [
                "type": "ended"
            ])
        }
    }

    // MARK: - Module Export

    @objc static override func requiresMainQueueSetup() -> Bool {
        return false
    }
}
```

### ActivityKit Attributes Definition

```swift
// ios/StudyTimerModule/StudyTimerAttributes.swift

import Foundation
import ActivityKit

struct StudyTimerAttributes: ActivityAttributes {
    // Static attributes (don't change during activity)
    public let sessionId: String
    public let title: String
    public let startTime: String

    // Dynamic state (changes during activity)
    public struct ContentState: Codable, Hashable {
        var elapsedSeconds: Int
        var isPaused: Bool

        // Computed property for formatted time
        var formattedTime: String {
            let hours = elapsedSeconds / 3600
            let minutes = (elapsedSeconds % 3600) / 60
            let seconds = elapsedSeconds % 60
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        }
    }
}
```

### Swift Widget UI (SwiftUI)

```swift
// ios/StudyTimerWidget/StudyTimerWidgetLiveActivity.swift

import ActivityKit
import WidgetKit
import SwiftUI

struct StudyTimerWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: StudyTimerAttributes.self) { context in
            // Lock Screen / Banner UI
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        Image(systemName: "book.fill")
                        Text(context.attributes.title)
                            .lineLimit(1)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.formattedTime)
                        .font(.system(.title2, design: .monospaced))
                        .foregroundColor(context.state.isPaused ? .orange : .green)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        if context.state.isPaused {
                            Image(systemName: "pause.circle.fill")
                                .foregroundColor(.orange)
                            Text("Paused")
                                .foregroundColor(.orange)
                        } else {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("Studying...")
                        }
                    }
                }
            } compactLeading: {
                // Compact leading - icon or abbreviated title
                Image(systemName: context.state.isPaused ? "pause.circle.fill" : "book.fill")
                    .foregroundColor(context.state.isPaused ? .orange : .green)
            } compactTrailing: {
                // Compact trailing - time
                Text(context.state.formattedTime)
                    .font(.system(.caption, design: .monospaced))
            } minimal: {
                // Minimal - just elapsed time
                Text(context.state.formattedTime)
                    .font(.system(.caption2, design: .monospaced))
            }
        }
    }
}

struct LockScreenView: View {
    let context: ActivityViewContext<StudyTimerAttributes>

    var body: some View {
        HStack {
            Image(systemName: "book.fill")
                .font(.title2)
                .foregroundColor(.blue)

            VStack(alignment: .leading) {
                Text(context.attributes.title)
                    .font(.headline)
                    .lineLimit(1)

                Text(context.state.isPaused ? "Paused" : "Studying")
                    .font(.caption)
                    .foregroundColor(context.state.isPaused ? .orange : .secondary)
            }

            Spacer()

            Text(context.state.formattedTime)
                .font(.system(.title, design: .monospaced))
                .foregroundColor(context.state.isPaused ? .orange : .primary)
        }
        .padding()
        .background(Color(.systemBackground))
    }
}
```

### Bridge Method Summary

| Method | Direction | Parameters | Returns | Description |
|--------|-----------|------------|---------|-------------|
| `startTimer` | RN -> Swift | `{sessionId, title, startTime}` | `{success, activityId?, error?}` | Creates Live Activity |
| `pauseTimer` | RN -> Swift | `sessionId` | `{success, error?}` | Updates activity to paused state |
| `resumeTimer` | RN -> Swift | `sessionId, elapsedSeconds` | `{success, error?}` | Updates activity to running state |
| `stopTimer` | RN -> Swift | `sessionId` | `{success}` | Ends Live Activity |
| `updateActivity` | RN -> Swift | `{elapsedSeconds, isPaused}` | `{success, error?}` | Updates elapsed time display |
| `hasActiveActivity` | RN -> Swift | none | `boolean` | Checks if activity exists |
| `getActiveActivityId` | RN -> Swift | none | `string?` | Gets current activity ID |
| `endAllActivities` | RN -> Swift | none | `void` | Cleanup all activities |
| `onActivityEvent` | Swift -> RN | event | n/a | Event emitter for activity lifecycle |

---

## 5. Implementation Checklist

### Phase 1: Database Layer
- [ ] Set up expo-sqlite
- [ ] Create database initialization script
- [ ] Implement sessions CRUD operations
- [ ] Implement session_history logging
- [ ] Add database migration support

### Phase 2: State Management
- [ ] Set up Zustand store
- [ ] Implement timer actions
- [ ] Add AsyncStorage persistence
- [ ] Handle app lifecycle (background/foreground)

### Phase 3: Native Bridge
- [ ] Create Expo module structure
- [ ] Implement StudyTimerModule.swift
- [ ] Define StudyTimerAttributes
- [ ] Create TypeScript interface
- [ ] Test bidirectional communication

### Phase 4: Live Activity Widget
- [ ] Create widget extension target
- [ ] Implement lock screen view
- [ ] Implement Dynamic Island views
- [ ] Handle activity lifecycle

### Phase 5: Integration
- [ ] Connect UI to Zustand store
- [ ] Connect store to database
- [ ] Connect store to native module
- [ ] End-to-end testing

---

## Appendix: File Structure

```
timer/
├── src/
│   ├── store/
│   │   └── timerStore.ts          # Zustand store
│   ├── db/
│   │   ├── database.ts            # SQLite initialization
│   │   ├── sessions.ts            # Session CRUD
│   │   └── history.ts             # History operations
│   ├── modules/
│   │   └── StudyTimerModule.ts    # Native bridge TypeScript
│   ├── hooks/
│   │   ├── useTimer.ts            # Timer logic hook
│   │   └── useDatabase.ts         # Database hook
│   └── screens/
│       ├── TimerScreen.tsx
│       └── HistoryScreen.tsx
├── ios/
│   ├── StudyTimerModule/
│   │   ├── StudyTimerModule.swift
│   │   ├── StudyTimerModule.m     # Obj-C bridge
│   │   └── StudyTimerAttributes.swift
│   └── StudyTimerWidget/
│       ├── StudyTimerWidgetBundle.swift
│       └── StudyTimerWidgetLiveActivity.swift
└── app.json                        # Expo config
```

---

*Last updated: 2026-01-30*
*Author: Grand Architect Agent*
