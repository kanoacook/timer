import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
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

  // Absolute session start time from Supabase (source of truth)
  const sessionStartTimeRef = useRef<number | null>(null);
  // Total seconds spent in paused state
  const totalPausedSecondsRef = useRef<number>(0);
  // When the current pause began (null if not paused)
  const pauseStartTimeRef = useRef<number | null>(null);

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
    totalPausedSecondsRef.current = 0;
    pauseStartTimeRef.current = null;

    // Create session in Supabase - this is our source of truth
    const session = await createSession(title || 'Study Session');

    // Use Supabase start_time as the absolute source of truth
    const startTimeMs = session
      ? new Date(session.start_time).getTime()
      : Date.now();
    sessionStartTimeRef.current = startTimeMs;

    if (session) {
      sessionIdRef.current = session.id;
      setSessionId(session.id);
    }

    // Start Live Activity with the Supabase start time
    const activityId = session?.id ?? `local_${Date.now()}`;
    LiveActivity.startActivity(activityId, title || 'Study Session', startTimeMs).catch((error) => {
      console.warn('Failed to start Live Activity:', error);
    });

    // Log activity started event
    if (session) {
      logSessionEvent(session.id, 'activity_started', 0).catch(() => {});
    }

    clearTimerInterval();
    intervalRef.current = setInterval(() => {
      // Calculate elapsed from absolute start time minus paused time
      if (sessionStartTimeRef.current !== null) {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartTimeRef.current) / 1000) - totalPausedSecondsRef.current;
        elapsedRef.current = elapsed;
        setElapsedSeconds(elapsed);
      }
      // Note: Don't update Live Activity every second - SwiftUI Text(timerInterval:) handles counting automatically
    }, 1000);
  }, [clearTimerInterval]);

  const pauseSession = useCallback(async () => {
    const currentElapsed = elapsedRef.current;
    setTimerStatus('paused');
    clearTimerInterval();

    // Record when this pause started
    pauseStartTimeRef.current = Date.now();

    // Update Live Activity to show paused state with current totalPausedSeconds
    LiveActivity.updateActivity(totalPausedSecondsRef.current, true).catch((error) => {
      console.warn('Failed to update Live Activity (pause):', error);
    });

    // Update session status in Supabase
    if (sessionIdRef.current) {
      await updateSessionStatus(sessionIdRef.current, 'paused', currentElapsed);
      await logSessionEvent(sessionIdRef.current, 'paused', currentElapsed);
    }
  }, [clearTimerInterval]);

  const resumeSession = useCallback(async () => {
    setTimerStatus('running');

    // Add the pause duration to total paused seconds
    if (pauseStartTimeRef.current !== null) {
      const pauseDuration = Math.floor((Date.now() - pauseStartTimeRef.current) / 1000);
      totalPausedSecondsRef.current += pauseDuration;
      pauseStartTimeRef.current = null;
    }

    // Update Live Activity to show running state with updated totalPausedSeconds
    LiveActivity.updateActivity(totalPausedSecondsRef.current, false).catch((error) => {
      console.warn('Failed to update Live Activity (resume):', error);
    });

    // Calculate current elapsed for Supabase update
    const currentElapsed = sessionStartTimeRef.current !== null
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000) - totalPausedSecondsRef.current
      : elapsedRef.current;

    // Update session status in Supabase
    if (sessionIdRef.current) {
      await updateSessionStatus(sessionIdRef.current, 'active', currentElapsed);
      await logSessionEvent(sessionIdRef.current, 'resumed', currentElapsed);
    }

    intervalRef.current = setInterval(() => {
      // Calculate elapsed from absolute start time minus paused time
      if (sessionStartTimeRef.current !== null) {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartTimeRef.current) / 1000) - totalPausedSecondsRef.current;
        elapsedRef.current = elapsed;
        setElapsedSeconds(elapsed);
      }
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
    sessionStartTimeRef.current = null;
    totalPausedSecondsRef.current = 0;
    pauseStartTimeRef.current = null;

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

  // Recalculate elapsed time when app returns to foreground
  // This ensures the timer stays in sync even if JS execution was suspended
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && sessionStartTimeRef.current !== null) {
        // App came to foreground - recalculate elapsed from absolute times
        const now = Date.now();

        if (timerStatus === 'running') {
          // Running: calculate elapsed = (now - start) - totalPaused
          const elapsed = Math.floor((now - sessionStartTimeRef.current) / 1000) - totalPausedSecondsRef.current;
          elapsedRef.current = elapsed;
          setElapsedSeconds(elapsed);
        } else if (timerStatus === 'paused' && pauseStartTimeRef.current !== null) {
          // Paused: calculate elapsed at the moment of pause
          // Don't update totalPausedSeconds yet - that happens on resume
          const elapsedAtPause = Math.floor((pauseStartTimeRef.current - sessionStartTimeRef.current) / 1000) - totalPausedSecondsRef.current;
          elapsedRef.current = elapsedAtPause;
          setElapsedSeconds(elapsedAtPause);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [timerStatus]);

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
