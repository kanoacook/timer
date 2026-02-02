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
