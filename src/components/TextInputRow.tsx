/**
 * TextInputRow — numeric text input for user-facing parameters.
 * Replaces the + / − stepper buttons with a proper text input so users
 * can type decimal values directly (e.g. 0.35).
 */

import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLOR } from '../styles';

export interface TextInputRowProps {
  label: string;
  value: string;
  unit: string;
  disabled?: boolean;
  onChangeText: (text: string) => void;
}

export function TextInputRow({
  label,
  value,
  unit,
  disabled = false,
  onChangeText,
}: TextInputRowProps): React.ReactElement {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          editable={!disabled}
          selectTextOnFocus
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 0,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLOR.divider,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR.secondary,
    flex: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    fontSize: 18,
    fontWeight: '700',
    color: COLOR.primary,
    textAlign: 'right',
    minWidth: 60,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLOR.divider,
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    color: '#9CA3AF',
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: COLOR.secondary,
    marginLeft: 4,
    minWidth: 30,
  },
});
