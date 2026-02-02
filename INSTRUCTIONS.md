# Study Timer iOS App - Complete Implementation Guide

This document contains complete, step-by-step instructions to build a Study Timer iOS app from scratch with iOS Live Activities (Dynamic Island and Lock Screen widgets), React Native (Expo), and Supabase backend.

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step-by-Step Setup](#3-step-by-step-setup)
   - [3.1 Initialize Project](#31-initialize-project)
   - [3.2 Install Dependencies](#32-install-dependencies)
   - [3.3 Configure app.json](#33-configure-appjson)
   - [3.4 Configure TypeScript](#34-configure-typescript)
   - [3.5 Configure EAS Build](#35-configure-eas-build)
   - [3.6 Create Environment Files](#36-create-environment-files)
   - [3.7 Set Up Supabase](#37-set-up-supabase)
   - [3.8 Create Type Definitions](#38-create-type-definitions)
   - [3.9 Create Utility Functions](#39-create-utility-functions)
   - [3.10 Create Library Files](#310-create-library-files)
   - [3.11 Create Session Service](#311-create-session-service)
   - [3.12 Create Live Activity Native Module](#312-create-live-activity-native-module)
   - [3.13 Create Expo Config Plugin](#313-create-expo-config-plugin)
   - [3.14 Create Timer Hook](#314-create-timer-hook)
   - [3.15 Create UI Components](#315-create-ui-components)
   - [3.16 Create Screens](#316-create-screens)
   - [3.17 Create App Entry Points](#317-create-app-entry-points)
4. [Build & Run Commands](#4-build--run-commands)
5. [Verification Checklist](#5-verification-checklist)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Project Overview

### What This App Does

A study timer app that helps users track focused study sessions with:

- **Count-up Timer**: Tracks how long you've been studying
- **iOS Live Activities**: Shows timer on Lock Screen and Dynamic Island (iPhone 14 Pro+)
- **Session Management**: Start, pause, resume, and stop study sessions
- **Cloud Sync**: Sessions are saved to Supabase for cross-device access
- **Device Identification**: Anonymous device-based session tracking

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native with Expo SDK 54 |
| Language | TypeScript |
| UI | React Native core components |
| Native Features | Expo Modules (Swift) |
| iOS Widgets | ActivityKit + WidgetKit |
| Backend | Supabase (PostgreSQL) |
| Auth | Anonymous (device-based) |
| Build | EAS Build |

### Key Features

- Minimalist iOS-style timer UI
- Real-time Live Activity updates on Lock Screen
- Dynamic Island integration (compact and expanded views)
- Session persistence across app restarts
- Event logging for analytics

---

## 2. Prerequisites

### Required Software

| Software | Version | Notes |
|----------|---------|-------|
| macOS | 13.0+ | Required for Xcode |
| Xcode | 15.0+ | Required for iOS builds |
| Node.js | 18.0+ | LTS recommended |
| npm | 9.0+ | Comes with Node.js |
| EAS CLI | 5.0+ | `npm install -g eas-cli` |

### Accounts Required

- **Apple Developer Account**: Required for Live Activities and device testing ($99/year)
- **Supabase Account**: Free tier is sufficient (https://supabase.com)
- **Expo Account**: Free (https://expo.dev)

### Hardware Requirements

- **iPhone with iOS 16.1+**: Required for Live Activities testing
- **iPhone 14 Pro or later**: Required for Dynamic Island testing
- Simulator does NOT support Live Activities

### Install Global Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Login to Apple Developer (will prompt during build)
eas credentials
```

---

## 3. Step-by-Step Setup

### 3.1 Initialize Project

Create a new Expo project with TypeScript template:

```bash
# Create the project
npx create-expo-app study-timer --template blank-typescript

# Navigate to project directory
cd study-timer
```

### 3.2 Install Dependencies

Install all required packages:

```bash
# Install Expo packages
npx expo install expo-dev-client expo-secure-store expo-status-bar

# Install Supabase client
npm install @supabase/supabase-js
```

Your `package.json` dependencies should look like this:

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
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.2"
  }
}
```

### 3.3 Configure app.json

Replace the contents of `app.json` with:

```json
{
  "expo": {
    "name": "Study Timer",
    "slug": "study-timer",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourname.studytimer",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "studytimer"
            ]
          }
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.yourname.studytimer"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-dev-client",
      "./plugins/withLiveActivities",
      "expo-secure-store"
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    },
    "owner": "your-expo-username"
  }
}
```

**Important**: Replace:
- `com.yourname.studytimer` with your bundle identifier
- `YOUR_EAS_PROJECT_ID` with your EAS project ID (get from `eas init`)
- `your-expo-username` with your Expo username

### 3.4 Configure TypeScript

Create/update `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

### 3.5 Configure EAS Build

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### 3.6 Create Environment Files

Create `.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Create `.env` (copy from .env.example and fill in your values):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

Add `.env` to `.gitignore`:

```
# Environment variables
.env
.env.local
```

### 3.7 Set Up Supabase

#### 3.7.1 Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Note your project URL and anon key from Settings > API

#### 3.7.2 Create Sessions Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Sessions table for storing study sessions
-- Adapted from SQLite schema for PostgreSQL/Supabase

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,  -- Identifies the device (for anonymous sync)
    title TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_sessions_device_id ON sessions(device_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert their own sessions
CREATE POLICY "Allow anonymous insert" ON sessions
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow users to read sessions from their device
CREATE POLICY "Allow read own sessions" ON sessions
    FOR SELECT
    USING (true);

-- Policy: Allow users to update their own sessions
CREATE POLICY "Allow update own sessions" ON sessions
    FOR UPDATE
    USING (true);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE sessions IS 'Study timer sessions - tracks active and completed study sessions';
COMMENT ON COLUMN sessions.device_id IS 'Unique device identifier for anonymous session tracking';
COMMENT ON COLUMN sessions.status IS 'Session status: active, paused, completed, or cancelled';
```

#### 3.7.3 Create Session History Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Session history table for tracking all state changes within a session
-- Event log for audit trail and analytics

CREATE TABLE session_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'started', 'paused', 'resumed', 'stopped',
        'activity_started', 'activity_updated', 'activity_ended'
    )),
    event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    elapsed_at_event INTEGER DEFAULT 0,
    metadata JSONB,  -- JSON blob for event-specific data
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_history_session_id ON session_history(session_id);
CREATE INDEX idx_history_event_type ON session_history(event_type);
CREATE INDEX idx_history_event_time ON session_history(event_time DESC);

-- Enable Row Level Security
ALTER TABLE session_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous insert
CREATE POLICY "Allow anonymous insert" ON session_history
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow read
CREATE POLICY "Allow read session history" ON session_history
    FOR SELECT
    USING (true);

COMMENT ON TABLE session_history IS 'Event log for tracking all state changes within study sessions';
COMMENT ON COLUMN session_history.event_type IS 'Event type: started, paused, resumed, stopped, activity_started, activity_updated, activity_ended';
COMMENT ON COLUMN session_history.elapsed_at_event IS 'Elapsed seconds at the time of the event';
COMMENT ON COLUMN session_history.metadata IS 'JSON blob for event-specific data';
```

### 3.8 Create Type Definitions

Create the directory structure:

```bash
mkdir -p src/types
```

#### 3.8.1 Create `src/types/timer.ts`

```typescript
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Session {
  id: string;
  title: string;
  startTime: Date;
  elapsedSeconds: number;
  status: TimerStatus;
}

export interface TimerState {
  currentSession: Session | null;
  timerStatus: TimerStatus;
  elapsedSeconds: number;
}

export interface TimerActions {
  startSession: (title: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
}
```

#### 3.8.2 Create `src/types/database.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      session_history: {
        Row: {
          created_at: string;
          elapsed_at_event: number | null;
          event_time: string;
          event_type: string;
          id: string;
          metadata: Json | null;
          session_id: string;
        };
        Insert: {
          created_at?: string;
          elapsed_at_event?: number | null;
          event_time?: string;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          session_id: string;
        };
        Update: {
          created_at?: string;
          elapsed_at_event?: number | null;
          event_time?: string;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_history_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      sessions: {
        Row: {
          created_at: string;
          device_id: string;
          duration_seconds: number | null;
          end_time: string | null;
          id: string;
          start_time: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          device_id: string;
          duration_seconds?: number | null;
          end_time?: string | null;
          id?: string;
          start_time?: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          device_id?: string;
          duration_seconds?: number | null;
          end_time?: string | null;
          id?: string;
          start_time?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export type SessionHistory = Database['public']['Tables']['session_history']['Row'];
export type SessionHistoryInsert = Database['public']['Tables']['session_history']['Insert'];

export type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type EventType =
  | 'started'
  | 'paused'
  | 'resumed'
  | 'stopped'
  | 'activity_started'
  | 'activity_updated'
  | 'activity_ended';
```

### 3.9 Create Utility Functions

Create the directory:

```bash
mkdir -p src/utils
```

#### 3.9.1 Create `src/utils/time.ts`

```typescript
export function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

### 3.10 Create Library Files

Create the directory:

```bash
mkdir -p src/lib
```

#### 3.10.1 Create `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

#### 3.10.2 Create `src/lib/deviceId.ts`

```typescript
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'studytimer_device_id';

// In-memory cache for device ID
let cachedDeviceId: string | null = null;

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `device_${timestamp}_${randomPart}`;
}

/**
 * Get or create a unique device ID for this device.
 * Persists to SecureStore so it survives app restarts.
 */
export async function getDeviceId(): Promise<string> {
  // Return cached value if available
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    // Try to load from persistent storage
    const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (storedId) {
      cachedDeviceId = storedId;
      return storedId;
    }

    // Generate new ID and persist it
    const newId = generateDeviceId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    cachedDeviceId = newId;
    return newId;
  } catch (error) {
    // Fallback to in-memory only if SecureStore fails
    console.warn('Failed to persist device ID:', error);
    if (!cachedDeviceId) {
      cachedDeviceId = generateDeviceId();
    }
    return cachedDeviceId;
  }
}

/**
 * Clear the stored device ID (useful for testing or reset)
 */
export async function clearDeviceId(): Promise<void> {
  cachedDeviceId = null;
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  } catch (error) {
    console.warn('Failed to clear device ID:', error);
  }
}
```

### 3.11 Create Session Service

Create the directory:

```bash
mkdir -p src/services
```

#### 3.11.1 Create `src/services/sessionService.ts`

```typescript
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import type {
  Json,
  Session,
  SessionInsert,
  SessionUpdate,
  SessionHistoryInsert,
  SessionStatus,
  EventType,
} from '../types/database';

/**
 * Session Service - handles all Supabase operations for sessions
 */

/**
 * Create a new session in Supabase
 */
export async function createSession(title: string): Promise<Session | null> {
  try {
    const deviceId = await getDeviceId();

    const sessionData: SessionInsert = {
      device_id: deviceId,
      title,
      status: 'active',
      duration_seconds: 0,
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return null;
    }

    // Log the 'started' event
    await logSessionEvent(data.id, 'started', 0);

    return data;
  } catch (error) {
    console.error('Failed to create session:', error);
    return null;
  }
}

/**
 * Update session status (pause/resume/complete)
 */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  durationSeconds: number
): Promise<Session | null> {
  try {
    const updateData: SessionUpdate = {
      status,
      duration_seconds: durationSeconds,
    };

    // If completing the session, set end_time
    if (status === 'completed' || status === 'cancelled') {
      updateData.end_time = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update session status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to update session status:', error);
    return null;
  }
}

/**
 * Log a session event to session_history
 */
export async function logSessionEvent(
  sessionId: string,
  eventType: EventType,
  elapsedAtEvent: number,
  metadata?: Json
): Promise<void> {
  try {
    const eventData: SessionHistoryInsert = {
      session_id: sessionId,
      event_type: eventType,
      elapsed_at_event: elapsedAtEvent,
      metadata: metadata,
    };

    const { error } = await supabase.from('session_history').insert(eventData);

    if (error) {
      console.error('Failed to log session event:', error);
    }
  } catch (error) {
    console.error('Failed to log session event:', error);
  }
}

/**
 * Get all completed sessions for the current device
 */
export async function getSessionHistory(limit = 50): Promise<Session[]> {
  try {
    const deviceId = await getDeviceId();

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('device_id', deviceId)
      .eq('status', 'completed')
      .order('end_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get session history:', error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error('Failed to get session history:', error);
    return [];
  }
}

/**
 * Get session statistics for the current device
 */
export async function getSessionStats(): Promise<{
  totalSessions: number;
  totalSeconds: number;
  todaySeconds: number;
}> {
  try {
    const deviceId = await getDeviceId();

    // Get all completed sessions
    const { data, error } = await supabase
      .from('sessions')
      .select('duration_seconds, end_time')
      .eq('device_id', deviceId)
      .eq('status', 'completed');

    if (error || !data) {
      console.error('Failed to get session stats:', error);
      return { totalSessions: 0, totalSeconds: 0, todaySeconds: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = data.reduce(
      (acc, session) => {
        const duration = session.duration_seconds ?? 0;
        acc.totalSessions += 1;
        acc.totalSeconds += duration;

        // Check if session ended today
        if (session.end_time) {
          const endDate = new Date(session.end_time);
          if (endDate >= today) {
            acc.todaySeconds += duration;
          }
        }

        return acc;
      },
      { totalSessions: 0, totalSeconds: 0, todaySeconds: 0 }
    );

    return stats;
  } catch (error) {
    console.error('Failed to get session stats:', error);
    return { totalSessions: 0, totalSeconds: 0, todaySeconds: 0 };
  }
}

/**
 * Get active or paused session for the current device (for recovery)
 */
export async function getActiveSession(): Promise<Session | null> {
  try {
    const deviceId = await getDeviceId();

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('device_id', deviceId)
      .in('status', ['active', 'paused'])
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No active session is not an error
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to get active session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get active session:', error);
    return null;
  }
}
```

### 3.12 Create Live Activity Native Module

This is the most complex part - creating an Expo module that bridges to iOS ActivityKit.

Create the directory structure:

```bash
mkdir -p modules/live-activity/src
mkdir -p modules/live-activity/ios
```

#### 3.12.1 Create `modules/live-activity/package.json`

```json
{
  "name": "live-activity",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "expo": {
    "autolinking": {
      "nativeModulesDir": "."
    }
  }
}
```

#### 3.12.2 Create `modules/live-activity/expo-module.config.json`

```json
{
  "platforms": ["ios"],
  "ios": {
    "modules": ["LiveActivityModule"]
  }
}
```

#### 3.12.3 Create `modules/live-activity/src/LiveActivity.types.ts`

```typescript
export interface StartActivityResult {
  success: boolean;
  activityId?: string;
  startTime?: number; // JS timestamp in ms
  error?: string;
}
```

#### 3.12.4 Create `modules/live-activity/src/index.ts`

```typescript
import { Platform } from 'react-native';
import type { StartActivityResult } from './LiveActivity.types';

// Safely require the native module (may not exist in Expo Go or on non-iOS)
let LiveActivityModule: any = null;

if (Platform.OS === 'ios') {
  try {
    // Use expo's re-export of requireNativeModule
    const { requireNativeModule } = require('expo');
    LiveActivityModule = requireNativeModule('LiveActivity');
  } catch (error) {
    // Module not available (e.g., in Expo Go or simulator without dev build)
    console.log('LiveActivity module not available:', error);
  }
}

/**
 * Check if Live Activities are supported on this device
 */
export function isSupported(): boolean {
  if (!LiveActivityModule) return false;
  return LiveActivityModule.isSupported();
}

/**
 * Start a new Live Activity for a study session
 * @param sessionId - Unique identifier for the session
 * @param title - Display title for the session
 * @returns Promise with success status, activity ID, and start time if successful
 */
export async function startActivity(
  sessionId: string,
  title: string
): Promise<StartActivityResult> {
  if (!LiveActivityModule) {
    return { success: false, error: 'Live Activities not supported on this platform' };
  }
  return LiveActivityModule.startActivity(sessionId, title);
}

/**
 * Update the current Live Activity state
 * @param accumulatedSeconds - Total accumulated seconds
 * @param isPaused - Whether the timer is currently paused
 * @param startTime - Optional JS timestamp (ms) for when the current running segment started
 * @returns Promise resolving to true if update was successful
 */
export async function updateActivity(
  accumulatedSeconds: number,
  isPaused: boolean,
  startTime?: number
): Promise<boolean> {
  if (!LiveActivityModule) return false;
  return LiveActivityModule.updateActivity(accumulatedSeconds, isPaused, startTime ?? null);
}

/**
 * End the current Live Activity
 * @returns Promise resolving to true if the activity was ended
 */
export async function endActivity(): Promise<boolean> {
  if (!LiveActivityModule) return false;
  return LiveActivityModule.endActivity();
}

/**
 * End all Live Activities (cleanup on app launch)
 */
export async function endAllActivities(): Promise<void> {
  if (!LiveActivityModule) return;
  return LiveActivityModule.endAllActivities();
}

/**
 * Get the current activity ID (if any)
 */
export function getCurrentActivityId(): string | null {
  if (!LiveActivityModule) return null;
  return LiveActivityModule.getCurrentActivityId();
}

export type { StartActivityResult };
```

#### 3.12.5 Create `modules/live-activity/ios/StudyTimerAttributes.swift`

This defines the data model for the Live Activity:

```swift
import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct StudyTimerAttributes: ActivityAttributes {
    /// Static data that doesn't change during the activity
    let sessionId: String
    let title: String

    /// Dynamic data that updates during the activity
    struct ContentState: Codable, Hashable {
        var startDate: Date
        var accumulatedSeconds: Int
        var isPaused: Bool

        /// Computed timer interval for SwiftUI Text(timerInterval:)
        var timerInterval: ClosedRange<Date> {
            let adjustedStart = startDate.addingTimeInterval(-Double(accumulatedSeconds))
            return adjustedStart...Date.distantFuture
        }
    }
}
```

#### 3.12.6 Create `modules/live-activity/ios/LiveActivityModule.swift`

This is the Expo native module that bridges to ActivityKit:

```swift
import ExpoModulesCore
import ActivityKit

public class LiveActivityModule: Module {
    // Keep track of the current activity
    private var currentActivityId: String?
    // Store the start date for the current session
    private var sessionStartDate: Date?

    public func definition() -> ModuleDefinition {
        Name("LiveActivity")

        // Check if Live Activities are supported
        Function("isSupported") { () -> Bool in
            if #available(iOS 16.2, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        // Start a new Live Activity
        AsyncFunction("startActivity") { (sessionId: String, title: String) -> [String: Any] in
            if #available(iOS 16.2, *) {
                // End any existing activity first
                await self.endAllActivitiesInternal()

                let startDate = Date()
                self.sessionStartDate = startDate

                let attributes = StudyTimerAttributes(sessionId: sessionId, title: title)
                let initialState = StudyTimerAttributes.ContentState(
                    startDate: startDate,
                    accumulatedSeconds: 0,
                    isPaused: false
                )

                do {
                    let activity = try Activity.request(
                        attributes: attributes,
                        content: .init(state: initialState, staleDate: nil),
                        pushType: nil
                    )
                    self.currentActivityId = activity.id
                    return [
                        "success": true,
                        "activityId": activity.id,
                        "startTime": startDate.timeIntervalSince1970 * 1000 // Return JS timestamp
                    ]
                } catch {
                    return ["success": false, "error": error.localizedDescription]
                }
            } else {
                return ["success": false, "error": "Live Activities require iOS 16.2+"]
            }
        }

        // Update the current Live Activity
        // Parameters: accumulatedSeconds, isPaused, startTime (optional JS timestamp in ms)
        AsyncFunction("updateActivity") { (accumulatedSeconds: Int, isPaused: Bool, startTime: Double?) -> Bool in
            if #available(iOS 16.2, *) {
                guard let activityId = self.currentActivityId else {
                    return false
                }

                // Use provided startTime or fall back to stored session start date
                let startDate: Date
                if let jsTimestamp = startTime {
                    startDate = Date(timeIntervalSince1970: jsTimestamp / 1000)
                } else if let stored = self.sessionStartDate {
                    startDate = stored
                } else {
                    // Fallback: calculate from accumulated seconds
                    startDate = Date().addingTimeInterval(-Double(accumulatedSeconds))
                }

                let newState = StudyTimerAttributes.ContentState(
                    startDate: startDate,
                    accumulatedSeconds: accumulatedSeconds,
                    isPaused: isPaused
                )

                // Find the activity by ID
                for activity in Activity<StudyTimerAttributes>.activities {
                    if activity.id == activityId {
                        await activity.update(
                            ActivityContent(state: newState, staleDate: nil)
                        )
                        return true
                    }
                }
                return false
            } else {
                return false
            }
        }

        // End the current Live Activity
        AsyncFunction("endActivity") { () -> Bool in
            if #available(iOS 16.2, *) {
                guard let activityId = self.currentActivityId else {
                    return false
                }

                for activity in Activity<StudyTimerAttributes>.activities {
                    if activity.id == activityId {
                        await activity.end(nil, dismissalPolicy: .immediate)
                        self.currentActivityId = nil
                        self.sessionStartDate = nil
                        return true
                    }
                }

                self.currentActivityId = nil
                self.sessionStartDate = nil
                return false
            } else {
                return false
            }
        }

        // End all Live Activities (cleanup)
        AsyncFunction("endAllActivities") { () -> Void in
            if #available(iOS 16.2, *) {
                await self.endAllActivitiesInternal()
            }
        }

        // Get the current activity state
        Function("getCurrentActivityId") { () -> String? in
            return self.currentActivityId
        }
    }

    @available(iOS 16.2, *)
    private func endAllActivitiesInternal() async {
        for activity in Activity<StudyTimerAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        self.currentActivityId = nil
        self.sessionStartDate = nil
    }
}
```

### 3.13 Create Expo Config Plugin

The config plugin handles all the Xcode project modifications needed for Live Activities.

Create the directory:

```bash
mkdir -p plugins
```

#### 3.13.1 Create `plugins/withLiveActivities.js`

This is a large file that:
1. Adds `NSSupportsLiveActivities` to Info.plist
2. Copies StudyTimerAttributes.swift to the main app
3. Creates the Widget Extension with all required Swift files
4. Adds the extension to the Xcode project

```javascript
const { withInfoPlist, withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_EXTENSION_NAME = 'StudyTimerWidgetExtension';
const WIDGET_BUNDLE_ID_SUFFIX = '.widget';

const withLiveActivities = (config) => {
  // Add NSSupportsLiveActivities to Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    return config;
  });

  // Copy StudyTimerAttributes.swift to main app
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, 'ios');
      const mainAppPath = path.join(iosPath, 'StudyTimer');
      const moduleAttributesPath = path.join(projectRoot, 'modules/live-activity/ios/StudyTimerAttributes.swift');
      const mainAppAttributesPath = path.join(mainAppPath, 'StudyTimerAttributes.swift');

      // Ensure main app directory exists
      if (!fs.existsSync(mainAppPath)) {
        fs.mkdirSync(mainAppPath, { recursive: true });
      }

      // Copy attributes file from module to main app
      if (fs.existsSync(moduleAttributesPath) && !fs.existsSync(mainAppAttributesPath)) {
        fs.copyFileSync(moduleAttributesPath, mainAppAttributesPath);
        console.log('Copied StudyTimerAttributes.swift to main app');
      }

      return config;
    },
  ]);

  // Add widget extension to Xcode project
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const iosPath = path.join(projectRoot, 'ios');
    const widgetExtensionPath = path.join(iosPath, WIDGET_EXTENSION_NAME);

    // Check if widget extension files exist
    if (!fs.existsSync(widgetExtensionPath)) {
      console.warn(`Widget extension path not found: ${widgetExtensionPath}`);
      return config;
    }

    const bundleId = config.ios?.bundleIdentifier || 'com.kanoa.studytimer';
    const widgetBundleId = bundleId + WIDGET_BUNDLE_ID_SUFFIX;

    // Check if widget extension target already exists
    let existingTarget = xcodeProject.pbxTargetByName(WIDGET_EXTENSION_NAME);
    let target;
    let widgetGroup;

    if (existingTarget) {
      console.log(`Widget extension target already exists, will add missing files`);
      target = existingTarget;

      // Find existing group
      const groupSection = xcodeProject.hash.project.objects['PBXGroup'];
      for (const key of Object.keys(groupSection)) {
        const group = groupSection[key];
        if (group && group.name === WIDGET_EXTENSION_NAME && group.path === WIDGET_EXTENSION_NAME) {
          widgetGroup = { uuid: key };
          break;
        }
      }
    } else {
      // Create the widget extension target
      target = xcodeProject.addTarget(
        WIDGET_EXTENSION_NAME,
        'app_extension',
        WIDGET_EXTENSION_NAME,
        widgetBundleId
      );

      // Create a PBXGroup for the widget extension
      widgetGroup = xcodeProject.addPbxGroup(
        [],
        WIDGET_EXTENSION_NAME,
        WIDGET_EXTENSION_NAME
      );

      // Add group to main project group
      const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
      xcodeProject.addToPbxGroup(widgetGroup.uuid, mainGroup);

      // Add widget extension as dependency of main app
      xcodeProject.addTargetDependency(
        xcodeProject.getFirstTarget().uuid,
        [target.uuid]
      );

      // Set build settings for widget extension
      const buildConfigurationList = xcodeProject.pbxXCConfigurationList();
      Object.keys(buildConfigurationList).forEach((key) => {
        const buildConfig = buildConfigurationList[key];
        if (buildConfig.buildConfigurations) {
          buildConfig.buildConfigurations.forEach((configRef) => {
            const configSettings = xcodeProject.pbxXCBuildConfigurationSection()[configRef.value];
            if (configSettings && configSettings.name) {
              configSettings.buildSettings = configSettings.buildSettings || {};
              if (configSettings.buildSettings.PRODUCT_NAME === `"${WIDGET_EXTENSION_NAME}"`) {
                configSettings.buildSettings.SWIFT_VERSION = '5.0';
                configSettings.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
                configSettings.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.1';
                configSettings.buildSettings.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
                configSettings.buildSettings.INFOPLIST_FILE = `${WIDGET_EXTENSION_NAME}/Info.plist`;
                configSettings.buildSettings.SKIP_INSTALL = 'YES';
                configSettings.buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
              }
            }
          });
        }
      });

      // Add Embed App Extensions build phase to main app
      const mainTarget = xcodeProject.getFirstTarget();
      xcodeProject.addBuildPhase(
        [],
        'PBXCopyFilesBuildPhase',
        'Embed App Extensions',
        mainTarget.uuid,
        'app_extension',
        ''
      );
    }

    // Get the target's native target object to find its build phases
    const nativeTargets = xcodeProject.pbxNativeTargetSection();
    let sourcesBuildPhaseUuid = null;

    for (const key of Object.keys(nativeTargets)) {
      const nativeTarget = nativeTargets[key];
      if (nativeTarget && nativeTarget.name === WIDGET_EXTENSION_NAME) {
        // Find the Sources build phase
        if (nativeTarget.buildPhases) {
          const sourcesPhaseSection = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
          for (const phase of nativeTarget.buildPhases) {
            if (sourcesPhaseSection && sourcesPhaseSection[phase.value]) {
              sourcesBuildPhaseUuid = phase.value;
              break;
            }
          }
        }
        break;
      }
    }

    // Check which files are already in the Sources build phase
    const existingFiles = new Set();
    if (sourcesBuildPhaseUuid) {
      const buildPhaseSection = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
      const sourcesPhase = buildPhaseSection[sourcesBuildPhaseUuid];
      if (sourcesPhase && sourcesPhase.files) {
        for (const fileEntry of sourcesPhase.files) {
          const buildFile = xcodeProject.hash.project.objects['PBXBuildFile'][fileEntry.value];
          if (buildFile && buildFile.fileRef) {
            const fileRef = xcodeProject.hash.project.objects['PBXFileReference'][buildFile.fileRef];
            if (fileRef && fileRef.name) {
              existingFiles.add(fileRef.name);
            }
          }
        }
      }
    }

    // Add Swift files to the widget extension
    const swiftFiles = [
      'StudyTimerWidgetBundle.swift',
      'StudyTimerLiveActivity.swift',
      'StudyTimerAttributes.swift'
    ];

    swiftFiles.forEach((fileName) => {
      // Skip if file already added
      if (existingFiles.has(fileName)) {
        console.log(`File ${fileName} already in Sources, skipping`);
        return;
      }

      const filePath = path.join(widgetExtensionPath, fileName);
      if (fs.existsSync(filePath)) {
        // Create file reference
        const fileRefUuid = xcodeProject.generateUuid();
        const fileRef = {
          isa: 'PBXFileReference',
          lastKnownFileType: 'sourcecode.swift',
          name: fileName,
          path: fileName,
          sourceTree: '"<group>"'
        };
        xcodeProject.hash.project.objects['PBXFileReference'][fileRefUuid] = fileRef;
        xcodeProject.hash.project.objects['PBXFileReference'][`${fileRefUuid}_comment`] = fileName;

        // Add to widget group
        if (widgetGroup) {
          const groupSection = xcodeProject.hash.project.objects['PBXGroup'];
          if (groupSection[widgetGroup.uuid] && groupSection[widgetGroup.uuid].children) {
            // Check if already in group
            const alreadyInGroup = groupSection[widgetGroup.uuid].children.some(
              child => child.comment === fileName
            );
            if (!alreadyInGroup) {
              groupSection[widgetGroup.uuid].children.push({
                value: fileRefUuid,
                comment: fileName
              });
            }
          }
        }

        // Create build file for Sources phase
        if (sourcesBuildPhaseUuid) {
          const buildFileUuid = xcodeProject.generateUuid();
          xcodeProject.hash.project.objects['PBXBuildFile'][buildFileUuid] = {
            isa: 'PBXBuildFile',
            fileRef: fileRefUuid,
            fileRef_comment: fileName
          };
          xcodeProject.hash.project.objects['PBXBuildFile'][`${buildFileUuid}_comment`] = `${fileName} in Sources`;

          // Add to Sources build phase
          const buildPhaseSection = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
          if (buildPhaseSection[sourcesBuildPhaseUuid] && buildPhaseSection[sourcesBuildPhaseUuid].files) {
            buildPhaseSection[sourcesBuildPhaseUuid].files.push({
              value: buildFileUuid,
              comment: `${fileName} in Sources`
            });
          }
        }
        console.log(`Added ${fileName} to widget extension`);
      }
    });

    // Add Info.plist to the group (but not to Sources)
    const infoPlistPath = path.join(widgetExtensionPath, 'Info.plist');
    if (fs.existsSync(infoPlistPath) && widgetGroup) {
      const groupSection = xcodeProject.hash.project.objects['PBXGroup'];
      const alreadyHasInfoPlist = groupSection[widgetGroup.uuid]?.children?.some(
        child => child.comment === 'Info.plist'
      );

      if (!alreadyHasInfoPlist) {
        const plistRefUuid = xcodeProject.generateUuid();
        xcodeProject.hash.project.objects['PBXFileReference'][plistRefUuid] = {
          isa: 'PBXFileReference',
          lastKnownFileType: 'text.plist.xml',
          name: 'Info.plist',
          path: 'Info.plist',
          sourceTree: '"<group>"'
        };
        xcodeProject.hash.project.objects['PBXFileReference'][`${plistRefUuid}_comment`] = 'Info.plist';

        if (groupSection[widgetGroup.uuid] && groupSection[widgetGroup.uuid].children) {
          groupSection[widgetGroup.uuid].children.push({
            value: plistRefUuid,
            comment: 'Info.plist'
          });
        }
      }
    }

    return config;
  });

  // Create widget extension files
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, 'ios');
      const widgetExtensionPath = path.join(iosPath, WIDGET_EXTENSION_NAME);

      // Ensure widget extension directory exists
      if (!fs.existsSync(widgetExtensionPath)) {
        fs.mkdirSync(widgetExtensionPath, { recursive: true });
      }

      // Create Info.plist
      const infoPlistPath = path.join(widgetExtensionPath, 'Info.plist');
      if (!fs.existsSync(infoPlistPath)) {
        const bundleId = config.ios?.bundleIdentifier || 'com.kanoa.studytimer';
        const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Study Timer Widget</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}.widget</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
</dict>
</plist>`;
        fs.writeFileSync(infoPlistPath, infoPlistContent);
        console.log('Created Info.plist for widget extension');
      }

      // Create StudyTimerAttributes.swift
      const attributesPath = path.join(widgetExtensionPath, 'StudyTimerAttributes.swift');
      if (!fs.existsSync(attributesPath)) {
        // Try to copy from modules first
        const moduleAttributesPath = path.join(projectRoot, 'modules/live-activity/ios/StudyTimerAttributes.swift');
        if (fs.existsSync(moduleAttributesPath)) {
          fs.copyFileSync(moduleAttributesPath, attributesPath);
        } else {
          const attributesContent = `import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct StudyTimerAttributes: ActivityAttributes {
    let sessionId: String
    let title: String

    struct ContentState: Codable, Hashable {
        var startDate: Date
        var accumulatedSeconds: Int
        var isPaused: Bool

        var timerInterval: ClosedRange<Date> {
            let adjustedStart = startDate.addingTimeInterval(-Double(accumulatedSeconds))
            return adjustedStart...Date.distantFuture
        }
    }
}
`;
          fs.writeFileSync(attributesPath, attributesContent);
        }
        console.log('Created StudyTimerAttributes.swift for widget extension');
      }

      // Create StudyTimerWidgetBundle.swift
      const bundlePath = path.join(widgetExtensionPath, 'StudyTimerWidgetBundle.swift');
      if (!fs.existsSync(bundlePath)) {
        const bundleContent = `import SwiftUI
import WidgetKit

@main
struct StudyTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.1, *) {
            StudyTimerLiveActivity()
        }
    }
}
`;
        fs.writeFileSync(bundlePath, bundleContent);
        console.log('Created StudyTimerWidgetBundle.swift for widget extension');
      }

      // Create StudyTimerLiveActivity.swift
      const liveActivityPath = path.join(widgetExtensionPath, 'StudyTimerLiveActivity.swift');
      if (!fs.existsSync(liveActivityPath)) {
        const liveActivityContent = `import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
struct StudyTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: StudyTimerAttributes.self) { context in
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.attributes.title)
                            .font(.headline)
                            .lineLimit(1)
                        Text(context.state.isPaused ? "Paused" : "Studying")
                            .font(.caption)
                            .foregroundColor(context.state.isPaused ? .orange : .green)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 4) {
                        if context.state.isPaused {
                            Text(formatTime(context.state.accumulatedSeconds))
                                .font(.system(.title, design: .monospaced))
                                .fontWeight(.bold)
                        } else {
                            Text(timerInterval: context.state.timerInterval, countsDown: false)
                                .font(.system(.title, design: .monospaced))
                                .fontWeight(.bold)
                                .monospacedDigit()
                        }
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Image(systemName: context.state.isPaused ? "pause.circle.fill" : "book.fill")
                            .foregroundColor(context.state.isPaused ? .orange : .green)
                        Text(context.state.isPaused ? "Session Paused" : "Session Active")
                            .font(.caption)
                    }
                }
            } compactLeading: {
                Image(systemName: context.state.isPaused ? "pause.circle.fill" : "book.fill")
                    .foregroundColor(context.state.isPaused ? .orange : .green)
            } compactTrailing: {
                if context.state.isPaused {
                    Text(formatTime(context.state.accumulatedSeconds))
                        .font(.system(.caption, design: .monospaced))
                        .monospacedDigit()
                } else {
                    Text(timerInterval: context.state.timerInterval, countsDown: false)
                        .font(.system(.caption, design: .monospaced))
                        .monospacedDigit()
                }
            } minimal: {
                Image(systemName: "book.fill")
                    .foregroundColor(context.state.isPaused ? .orange : .green)
            }
        }
    }

    private func formatTime(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

@available(iOS 16.1, *)
struct LockScreenView: View {
    let context: ActivityViewContext<StudyTimerAttributes>

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: "book.fill")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(context.attributes.title)
                        .font(.headline)
                        .lineLimit(1)
                }
                HStack(spacing: 4) {
                    Circle()
                        .fill(context.state.isPaused ? Color.orange : Color.green)
                        .frame(width: 8, height: 8)
                    Text(context.state.isPaused ? "Paused" : "Studying")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer(minLength: 0)
            if context.state.isPaused {
                Text(formatTime(context.state.accumulatedSeconds))
                    .font(.system(size: 32, weight: .medium, design: .rounded))
                    .monospacedDigit()
            } else {
                Text(timerInterval: context.state.timerInterval, countsDown: false)
                    .font(.system(size: 32, weight: .medium, design: .rounded))
                    .monospacedDigit()
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .activityBackgroundTint(Color.black.opacity(0.85))
        .widgetURL(URL(string: "studytimer://open"))
    }

    private func formatTime(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%02d:%02d", minutes, seconds)
    }
}
`;
        fs.writeFileSync(liveActivityPath, liveActivityContent);
        console.log('Created StudyTimerLiveActivity.swift for widget extension');
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withLiveActivities;
```

### 3.14 Create Timer Hook

Create the directory:

```bash
mkdir -p src/hooks
```

#### 3.14.1 Create `src/hooks/useTimer.ts`

This is the core timer logic that integrates with Live Activities and Supabase:

```typescript
import { useState, useRef, useEffect, useCallback } from 'react';
import type { TimerStatus, TimerState, TimerActions } from '../types/timer';
import * as LiveActivity from '../../modules/live-activity/src';
import {
  createSession,
  updateSessionStatus,
  logSessionEvent,
} from '../services/sessionService';

interface UseTimerReturn extends TimerState, TimerActions {
  sessionName: string;
  setSessionName: (name: string) => void;
  sessionId: string | null;
}

export function useTimer(): UseTimerReturn {
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionName, setSessionName] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const elapsedRef = useRef<number>(0); // Track elapsed for async operations
  // Track when the current running segment started (for Live Activity timer calculations)
  const segmentStartTimeRef = useRef<number | null>(null);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startSession = useCallback(async (title: string) => {
    setSessionName(title);
    setTimerStatus('running');
    setElapsedSeconds(0);
    elapsedRef.current = 0;

    const now = Date.now();
    segmentStartTimeRef.current = now;

    // Create session in Supabase
    const session = await createSession(title || 'Study Session');
    if (session) {
      sessionIdRef.current = session.id;
      setSessionId(session.id);
    }

    // Start Live Activity
    const activityId = session?.id ?? `local_${Date.now()}`;
    LiveActivity.startActivity(activityId, title || 'Study Session').catch((error) => {
      console.warn('Failed to start Live Activity:', error);
    });

    // Log activity started event
    if (session) {
      logSessionEvent(session.id, 'activity_started', 0).catch(() => {});
    }

    clearTimerInterval();
    let currentElapsed = 0;
    intervalRef.current = setInterval(() => {
      currentElapsed += 1;
      elapsedRef.current = currentElapsed;
      setElapsedSeconds(currentElapsed);
      // Note: Don't update Live Activity every second - SwiftUI Text(timerInterval:) handles counting automatically
    }, 1000);
  }, [clearTimerInterval]);

  const pauseSession = useCallback(async () => {
    const currentElapsed = elapsedRef.current;
    setTimerStatus('paused');
    clearTimerInterval();

    // Clear segment start time since we're paused
    segmentStartTimeRef.current = null;

    // Update Live Activity to show paused state (no startTime needed when paused)
    LiveActivity.updateActivity(currentElapsed, true).catch((error) => {
      console.warn('Failed to update Live Activity (pause):', error);
    });

    // Update session status in Supabase
    if (sessionIdRef.current) {
      await updateSessionStatus(sessionIdRef.current, 'paused', currentElapsed);
      await logSessionEvent(sessionIdRef.current, 'paused', currentElapsed);
    }
  }, [clearTimerInterval]);

  const resumeSession = useCallback(async () => {
    const currentElapsed = elapsedRef.current;
    setTimerStatus('running');

    // Set new segment start time for resumed session
    // The segment start time needs to be adjusted to account for already accumulated time
    const now = Date.now();
    segmentStartTimeRef.current = now;

    // Update Live Activity to show running state with new segment start time
    LiveActivity.updateActivity(currentElapsed, false, now).catch((error) => {
      console.warn('Failed to update Live Activity (resume):', error);
    });

    // Update session status in Supabase
    if (sessionIdRef.current) {
      await updateSessionStatus(sessionIdRef.current, 'active', currentElapsed);
      await logSessionEvent(sessionIdRef.current, 'resumed', currentElapsed);
    }

    let elapsed = currentElapsed;
    intervalRef.current = setInterval(() => {
      elapsed += 1;
      elapsedRef.current = elapsed;
      setElapsedSeconds(elapsed);
      // Note: Don't update Live Activity every second - SwiftUI Text(timerInterval:) handles counting automatically
    }, 1000);
  }, []);

  const stopSession = useCallback(async () => {
    const finalElapsed = elapsedRef.current;
    const currentSessionId = sessionIdRef.current;

    clearTimerInterval();

    // Update session status in Supabase (mark as completed)
    if (currentSessionId) {
      await updateSessionStatus(currentSessionId, 'completed', finalElapsed);
      await logSessionEvent(currentSessionId, 'stopped', finalElapsed);
      await logSessionEvent(currentSessionId, 'activity_ended', finalElapsed);
    }

    // Reset local state
    setTimerStatus('idle');
    setElapsedSeconds(0);
    setSessionName('');
    setSessionId(null);
    sessionIdRef.current = null;
    elapsedRef.current = 0;
    segmentStartTimeRef.current = null;

    // End Live Activity
    LiveActivity.endActivity().catch((error) => {
      console.warn('Failed to end Live Activity:', error);
    });
  }, [clearTimerInterval]);

  // Cleanup on unmount and end any zombie activities on mount
  useEffect(() => {
    // Clean up any zombie activities from previous app sessions
    LiveActivity.endAllActivities().catch((error) => {
      console.warn('Failed to end all Live Activities:', error);
    });

    return () => {
      clearTimerInterval();
      // End activity when hook unmounts
      LiveActivity.endActivity().catch((error) => {
        console.warn('Failed to end Live Activity on unmount:', error);
      });
    };
  }, [clearTimerInterval]);

  return {
    currentSession: null, // Can be populated from getActiveSession if needed
    timerStatus,
    elapsedSeconds,
    sessionName,
    setSessionName,
    sessionId,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
  };
}
```

### 3.15 Create UI Components

Create the directory:

```bash
mkdir -p src/components/Timer
```

#### 3.15.1 Create `src/components/Timer/TimerDisplay.tsx`

```typescript
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatElapsedTime } from '../../utils/time';

interface TimerDisplayProps {
  elapsedSeconds: number;
}

export function TimerDisplay({ elapsedSeconds }: TimerDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatElapsedTime(elapsedSeconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  time: {
    fontSize: 76,
    fontWeight: '100',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    color: '#000',
    fontFamily: 'System',
  },
});
```

#### 3.15.2 Create `src/components/Timer/TimerControls.tsx`

```typescript
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { TimerStatus } from '../../types/timer';

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

interface CircleButtonProps {
  label: string;
  onPress: () => void;
  color: string;
  textColor?: string;
}

function CircleButton({ label, onPress, color, textColor = '#fff' }: CircleButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.circleButtonOuter, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.circleButtonInner, { backgroundColor: color }]}>
        <Text style={[styles.circleButtonText, { color: textColor }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
}: TimerControlsProps) {
  if (status === 'idle') {
    return (
      <View style={styles.container}>
        <CircleButton
          label="Start"
          onPress={onStart}
          color="#30D158"
        />
      </View>
    );
  }

  if (status === 'running') {
    return (
      <View style={styles.container}>
        <CircleButton
          label="Stop"
          onPress={onStop}
          color="#FF3B30"
        />
        <CircleButton
          label="Pause"
          onPress={onPause}
          color="#FF9F0A"
        />
      </View>
    );
  }

  // status === 'paused'
  return (
    <View style={styles.container}>
      <CircleButton
        label="Stop"
        onPress={onStop}
        color="#FF3B30"
      />
      <CircleButton
        label="Resume"
        onPress={onResume}
        color="#30D158"
      />
    </View>
  );
}

const BUTTON_SIZE = 84;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  circleButtonOuter: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  circleButtonInner: {
    width: BUTTON_SIZE - 6,
    height: BUTTON_SIZE - 6,
    borderRadius: (BUTTON_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
```

#### 3.15.3 Create `src/components/Timer/SessionInput.tsx`

```typescript
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface SessionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
}

export function SessionInput({ value, onChangeText, disabled }: SessionInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Session</Text>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder="What are you working on?"
        placeholderTextColor="#8E8E93"
        editable={!disabled}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    color: '#000',
  },
  inputDisabled: {
    backgroundColor: '#E5E5EA',
    color: '#3C3C43',
  },
});
```

### 3.16 Create Screens

Create the directory:

```bash
mkdir -p src/screens
```

#### 3.16.1 Create `src/screens/TimerScreen.tsx`

```typescript
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTimer } from '../hooks/useTimer';
import { TimerDisplay } from '../components/Timer/TimerDisplay';
import { SessionInput } from '../components/Timer/SessionInput';
import { TimerControls } from '../components/Timer/TimerControls';

export function TimerScreen() {
  const {
    timerStatus,
    elapsedSeconds,
    sessionName,
    setSessionName,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
  } = useTimer();

  const handleStart = () => {
    const title = sessionName.trim() || 'Untitled Session';
    startSession(title);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SessionInput
          value={sessionName}
          onChangeText={setSessionName}
          disabled={timerStatus !== 'idle'}
        />
        <TimerDisplay elapsedSeconds={elapsedSeconds} />
        <TimerControls
          status={timerStatus}
          onStart={handleStart}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={stopSession}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
});
```

### 3.17 Create App Entry Points

#### 3.17.1 Create `App.tsx`

```typescript
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { TimerScreen } from './src/screens/TimerScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <TimerScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
```

#### 3.17.2 Create `index.ts`

```typescript
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
```

#### 3.17.3 Update `package.json` main entry

Make sure your `package.json` has the correct main entry:

```json
{
  "name": "study-timer",
  "version": "1.0.0",
  "main": "index.ts",
  ...
}
```

---

## 4. Build & Run Commands

### 4.1 Initialize EAS Project

```bash
# Initialize EAS project (creates projectId in app.json)
eas init

# Configure credentials (you'll need an Apple Developer account)
eas credentials
```

### 4.2 Development Build (iOS Device)

Live Activities require a physical device - they don't work in the simulator.

```bash
# Build for iOS development (creates a dev client)
eas build --profile development --platform ios

# After build completes, install on your device via:
# 1. Scan QR code from EAS build page
# 2. Or download .ipa and install via Apple Configurator / Xcode
```

### 4.3 Start Development Server

```bash
# Start Expo development server
npx expo start --dev-client

# Scan QR code with your device (must have dev client installed)
```

### 4.4 Full Rebuild (After Native Changes)

When you modify native code (Swift files, config plugin, etc.):

```bash
# Clean and rebuild
rm -rf ios android node_modules
npm install
npx expo prebuild --clean
eas build --profile development --platform ios
```

### 4.5 Build Directly in Xcode

For faster iteration on native code:

```bash
# Generate native projects
npx expo prebuild

# Open in Xcode
open ios/StudyTimer.xcworkspace
```

Then in Xcode:
1. Select your device as the build target
2. Select the "StudyTimer" scheme (not the widget extension)
3. Press Cmd+R to build and run

### 4.6 Android Build (Optional)

```bash
# Build for Android
eas build --profile development --platform android

# Or run locally
npx expo run:android
```

---

## 5. Verification Checklist

After building and installing, verify each feature works:

### Timer Functionality
- [ ] App launches without errors
- [ ] Timer shows 00:00:00 initially
- [ ] Start button appears when idle
- [ ] Timer counts up when started (1 second intervals)
- [ ] Pause button appears when running
- [ ] Timer stops counting when paused
- [ ] Resume button appears when paused
- [ ] Timer continues from paused time on resume
- [ ] Stop button ends session and resets to 00:00:00

### Live Activities (iOS 16.1+ Device Required)
- [ ] Live Activity appears on Lock Screen when timer starts
- [ ] Lock Screen shows session title
- [ ] Lock Screen timer counts up in real-time
- [ ] Lock Screen shows "Studying" status when running
- [ ] Lock Screen shows "Paused" status when paused
- [ ] Lock Screen timer freezes when paused
- [ ] Live Activity disappears when timer stops

### Dynamic Island (iPhone 14 Pro+ Required)
- [ ] Compact view shows book icon and timer
- [ ] Compact view timer counts in real-time
- [ ] Expanded view shows title, status, and timer
- [ ] Color changes based on paused/running state
- [ ] Tapping Live Activity opens the app

### Supabase Integration
- [ ] Session appears in Supabase `sessions` table on start
- [ ] Session status updates when paused/resumed
- [ ] Session marked as completed when stopped
- [ ] Duration is saved correctly
- [ ] Events logged to `session_history` table

### Session Input
- [ ] Can type session name before starting
- [ ] Session name is disabled during active session
- [ ] Session name appears in Live Activity

---

## 6. Troubleshooting

### Live Activity Not Appearing

**Symptoms**: Timer starts but no Live Activity on Lock Screen or Dynamic Island

**Solutions**:
1. Check device is iOS 16.1+ (Settings > General > About)
2. Check Live Activities are enabled: Settings > Face ID & Passcode > Live Activities
3. Check app-specific setting: Settings > Study Timer > Live Activities
4. Ensure you're using a dev build (not Expo Go)
5. Check console for errors: `LiveActivity module not available`

### Widget Extension Build Errors

**Symptoms**: Xcode shows errors about StudyTimerWidgetExtension

**Solutions**:
1. Clean build folder: Xcode > Product > Clean Build Folder
2. Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Regenerate native projects: `npx expo prebuild --clean`
4. Verify widget files exist in `ios/StudyTimerWidgetExtension/`

### Code Signing Issues

**Symptoms**: "Signing certificate" or "provisioning profile" errors

**Solutions**:
1. Open Xcode and go to Signing & Capabilities
2. Select your team for both main app AND widget extension
3. Use automatic signing
4. Ensure bundle IDs match app.json configuration

### Supabase Connection Issues

**Symptoms**: Sessions not saving, network errors in console

**Solutions**:
1. Verify `.env` file exists with correct values
2. Check Supabase project is not paused
3. Verify RLS policies allow inserts
4. Check network connectivity
5. Test in Supabase dashboard SQL editor

### Timer Not Updating Live Activity

**Symptoms**: Live Activity shows but timer doesn't count

**Solutions**:
1. The Live Activity timer uses SwiftUI's `Text(timerInterval:)` which counts automatically
2. Check `isPaused` is being set correctly
3. Verify `startDate` calculation in `StudyTimerAttributes.swift`
4. Check for errors in native module logs

### "Module not found" Errors

**Symptoms**: Import errors for live-activity module

**Solutions**:
1. Ensure `modules/live-activity/package.json` exists
2. Run `npm install` in project root
3. Check autolinking: `npx expo-doctor`
4. Rebuild: `npx expo prebuild --clean`

### Build Fails on EAS

**Symptoms**: EAS build fails with various errors

**Solutions**:
1. Check EAS build logs for specific error
2. Ensure all files are committed to git
3. Verify `app.json` has correct `owner` and `projectId`
4. Try local build first: `npx expo run:ios`

---

## Final Project Structure

After completing all steps, your project should look like this:

```
study-timer/
├── App.tsx
├── index.ts
├── app.json
├── package.json
├── tsconfig.json
├── eas.json
├── .env
├── .env.example
├── .gitignore
├── assets/
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
├── modules/
│   └── live-activity/
│       ├── package.json
│       ├── expo-module.config.json
│       ├── src/
│       │   ├── index.ts
│       │   └── LiveActivity.types.ts
│       └── ios/
│           ├── LiveActivityModule.swift
│           └── StudyTimerAttributes.swift
├── plugins/
│   └── withLiveActivities.js
├── src/
│   ├── types/
│   │   ├── timer.ts
│   │   └── database.ts
│   ├── utils/
│   │   └── time.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── deviceId.ts
│   ├── services/
│   │   └── sessionService.ts
│   ├── hooks/
│   │   └── useTimer.ts
│   ├── components/
│   │   └── Timer/
│   │       ├── TimerDisplay.tsx
│   │       ├── TimerControls.tsx
│   │       └── SessionInput.tsx
│   └── screens/
│       └── TimerScreen.tsx
└── supabase/
    └── migrations/
        ├── 20260130000001_create_sessions_table.sql
        └── 20260130000002_create_session_history_table.sql
```

---

## Summary

This guide provides everything needed to build a Study Timer app with:

1. **React Native + Expo** for cross-platform development
2. **iOS Live Activities** for Lock Screen and Dynamic Island widgets
3. **Supabase** for cloud persistence and session history
4. **Expo Modules** for native Swift/iOS integration
5. **EAS Build** for creating development and production builds

The key challenges addressed:
- Creating an Expo native module that bridges to ActivityKit
- Using config plugins to modify Xcode project for widget extensions
- Implementing real-time timer sync between app and Live Activity
- Handling pause/resume states correctly in both app and widget

Follow the steps in order, and you'll have a fully functional study timer with all iOS 16+ Live Activity features.
