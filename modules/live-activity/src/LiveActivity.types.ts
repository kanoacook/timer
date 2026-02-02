export interface StartActivityResult {
  success: boolean;
  activityId?: string;
  startTime?: number; // JS timestamp in ms
  error?: string;
}
