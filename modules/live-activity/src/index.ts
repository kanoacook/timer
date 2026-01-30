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
 * @returns Promise with success status and activity ID if successful
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
 * @param elapsedSeconds - Total elapsed seconds
 * @param isPaused - Whether the timer is currently paused
 * @returns Promise resolving to true if update was successful
 */
export async function updateActivity(
  elapsedSeconds: number,
  isPaused: boolean
): Promise<boolean> {
  if (!LiveActivityModule) return false;
  return LiveActivityModule.updateActivity(elapsedSeconds, isPaused);
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
