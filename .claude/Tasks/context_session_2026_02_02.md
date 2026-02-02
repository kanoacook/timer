# Context Session - 2026-02-02

## Task: Use Supabase Session Start Time as Source of Truth

### Problem
1. Lock screen shows "--" when dimmed (Always-On Display mode)
2. App timer freezes when phone is locked (JS interval stops in background)
3. Time gets out of sync between app, Live Activity, and Supabase

### Solution
Use Supabase `start_time` as absolute source of truth. Calculate elapsed time as:
```
elapsedSeconds = (now - sessionStartTime) - totalPausedSeconds
```

### Files Modified
- `src/hooks/useTimer.ts` - Add AppState listener, track sessionStartTime and totalPausedSeconds
- `modules/live-activity/ios/StudyTimerAttributes.swift` - Update to use totalPausedSeconds
- `ios/StudyTimerWidgetExtension/StudyTimerAttributes.swift` - Same
- `ios/StudyTimer/StudyTimerAttributes.swift` - Same
- `modules/live-activity/ios/LiveActivityModule.swift` - Update to use totalPausedSeconds
- `ios/StudyTimerWidgetExtension/StudyTimerLiveActivity.swift` - Add elapsedSeconds helper
- `modules/live-activity/src/index.ts` - Update comments/docs

### Implementation Status
- [x] Update useTimer.ts with AppState listener and proper time tracking
- [x] Update all StudyTimerAttributes.swift files
- [x] Update LiveActivityModule.swift
- [x] Update StudyTimerLiveActivity.swift
- [x] Update TypeScript types/comments

### Key Changes Made

#### 1. useTimer.ts
- Added `sessionStartTimeRef` - absolute start from Supabase (source of truth)
- Added `totalPausedSecondsRef` - tracks total pause duration
- Added `pauseStartTimeRef` - records when current pause began
- Added AppState listener that recalculates elapsed time when app returns to foreground
- All intervals now calculate elapsed as `(now - sessionStart) / 1000 - totalPausedSeconds`

#### 2. StudyTimerAttributes.swift (all 3 copies)
- Renamed `accumulatedSeconds` to `totalPausedSeconds`
- Changed `adjustedStartDate` logic: now adds `totalPausedSeconds` to shift start forward
  - Old: `startDate.addingTimeInterval(-accumulatedSeconds)` (shifted backward)
  - New: `startDate.addingTimeInterval(totalPausedSeconds)` (shifts forward)

#### 3. LiveActivityModule.swift
- Updated to use `totalPausedSeconds` instead of `accumulatedSeconds`
- `updateActivity` now ignores the startTime parameter and always uses stored session start

#### 4. StudyTimerLiveActivity.swift
- Added `elapsedSeconds(for:)` helper that calculates `now - startDate - totalPausedSeconds`
- Progress ring and paused time display now use this helper

### How It Works

**Running State:**
- SwiftUI `Text(timerInterval:)` counts from `adjustedStartDate` (startDate + totalPausedSeconds)
- Since totalPausedSeconds shifts the start forward, the timer shows correct elapsed time

**Paused State:**
- `elapsedSeconds(for:)` calculates `now - startDate - totalPausedSeconds`
- This gives the frozen time at pause moment

**On Resume:**
- Pause duration is added to `totalPausedSeconds`
- Live Activity updated with new `totalPausedSeconds`
- SwiftUI timer continues from correct adjusted start

**On Foreground:**
- AppState listener recalculates elapsed from absolute times
- Ensures JS timer matches what Live Activity shows

### Verification Steps
1. Start session, lock phone for 2+ minutes
2. Wake phone → lock screen shows correct time (not "--")
3. Open app → timer matches lock screen exactly
4. Pause → timer stops on both app and lock screen
5. Resume → timer continues from paused time
6. Stop → Supabase `duration_seconds` matches final displayed time
