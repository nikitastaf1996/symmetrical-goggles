/**
 * AutoPauseTextInput — blankable number/text input for autopause variables.
 * Keeps local text state so the user can delete freely; only updates the
 * store when text is non-empty. No clamp limits.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLOR } from '../styles';

export interface AutoPauseTextInputProps {
  label: string;
  value: number;
  unit: string;
  disabled?: boolean;
  displayValue?: (v: number) => string;
  onChange: (v: number | '') => void;
}

export function AutoPauseTextInput({
  label,
  value,
  unit,
  disabled = false,
  displayValue,
  onChange,
}: AutoPauseTextInputProps): React.ReactElement {
  const [text, setText] = useState(displayValue ? displayValue(value) : String(value));

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={text}
          onChangeText={(newText) => {
            setText(newText); // allow any text including empty/deletion freely
            if (newText === '') {
              onChange('');
              return;
            }
            // Pass any value directly — no parseFloat guard, no NaN filter
            onChange(Number(newText) as number);
          }}
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
