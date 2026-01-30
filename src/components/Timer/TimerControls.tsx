import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { TimerStatus } from '../../types/timer';

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

interface CircleButtonProps {
  label: string;
  onPress: () => void;
  color: string;
  textColor?: string;
}

function CircleButton({ label, onPress, color, textColor = '#fff' }: CircleButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.circleButtonOuter, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.circleButtonInner, { backgroundColor: color }]}>
        <Text style={[styles.circleButtonText, { color: textColor }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
}: TimerControlsProps) {
  if (status === 'idle') {
    return (
      <View style={styles.container}>
        <CircleButton
          label="Start"
          onPress={onStart}
          color="#30D158"
        />
      </View>
    );
  }

  if (status === 'running') {
    return (
      <View style={styles.container}>
        <CircleButton
          label="Stop"
          onPress={onStop}
          color="#FF3B30"
        />
        <CircleButton
          label="Pause"
          onPress={onPause}
          color="#FF9F0A"
        />
      </View>
    );
  }

  // status === 'paused'
  return (
    <View style={styles.container}>
      <CircleButton
        label="Stop"
        onPress={onStop}
        color="#FF3B30"
      />
      <CircleButton
        label="Resume"
        onPress={onResume}
        color="#30D158"
      />
    </View>
  );
}

const BUTTON_SIZE = 84;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  circleButtonOuter: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  circleButtonInner: {
    width: BUTTON_SIZE - 6,
    height: BUTTON_SIZE - 6,
    borderRadius: (BUTTON_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
