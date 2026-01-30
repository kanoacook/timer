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
