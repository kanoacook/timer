import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface SessionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
}

export function SessionInput({ value, onChangeText, disabled }: SessionInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Session</Text>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder="What are you working on?"
        placeholderTextColor="#8E8E93"
        editable={!disabled}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    color: '#000',
  },
  inputDisabled: {
    backgroundColor: '#E5E5EA',
    color: '#3C3C43',
  },
});
