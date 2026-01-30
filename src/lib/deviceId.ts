// In-memory cache for device ID (persists for app session)
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
 * Currently uses in-memory storage (ID persists for app session only).
 * TODO: Add persistent storage when running dev build with native modules.
 */
export async function getDeviceId(): Promise<string> {
  if (!cachedDeviceId) {
    cachedDeviceId = generateDeviceId();
  }
  return cachedDeviceId;
}

/**
 * Clear the stored device ID (useful for testing or reset)
 */
export async function clearDeviceId(): Promise<void> {
  cachedDeviceId = null;
}
