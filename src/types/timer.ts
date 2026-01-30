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
