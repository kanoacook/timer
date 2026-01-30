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
