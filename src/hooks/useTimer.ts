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

      // Update Live Activity every second
      LiveActivity.updateActivity(currentElapsed, false).catch((error) => {
        console.warn('Failed to update Live Activity:', error);
      });
    }, 1000);
  }, [clearTimerInterval]);

  const pauseSession = useCallback(async () => {
    const currentElapsed = elapsedRef.current;
    setTimerStatus('paused');
    clearTimerInterval();

    // Update Live Activity to show paused state
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

    // Update Live Activity to show running state
    LiveActivity.updateActivity(currentElapsed, false).catch((error) => {
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

      // Update Live Activity every second
      LiveActivity.updateActivity(elapsed, false).catch((error) => {
        console.warn('Failed to update Live Activity:', error);
      });
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
