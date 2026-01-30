import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatElapsedTime } from '../../utils/time';

interface TimerDisplayProps {
  elapsedSeconds: number;
}

export function TimerDisplay({ elapsedSeconds }: TimerDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatElapsedTime(elapsedSeconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  time: {
    fontSize: 76,
    fontWeight: '100',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    color: '#000',
    fontFamily: 'System',
  },
});
