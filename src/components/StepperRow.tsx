/**
 * StepperRow — numeric stepper for the data-reduction filter parameters.
 *
 * Extracted from App.tsx (O8). Self-contained: defines its own styles.
 *
 * Visually attaches to the toggle row above it: same horizontal padding,
 * same border, same background colour family, rounds only the BOTTOM
 * corners, no top border (the toggle row already drew it).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLOR } from '../styles';

export interface StepperRowProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  disabled: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}

export function StepperRow({
  label,
  value,
  unit,
  min,
  max,
  disabled,
  onDecrement,
  onIncrement,
}: StepperRowProps): React.ReactElement {
  const canDec = !disabled && value > min;
  const canInc = !disabled && value < max;
  return (
    <View style={[styles.stepperRow, disabled && styles.toggleRowLocked]}>
      <Pressable
        style={[styles.stepperBtn, !canDec && styles.stepperBtnDisabled]}
        onPress={onDecrement}
        disabled={!canDec}
        hitSlop={8}
      >
        <Text style={[styles.stepperBtnText, !canDec && styles.stepperBtnTextDisabled]}>−</Text>
      </Pressable>
      <View style={styles.stepperValueWrap}>
        <Text style={styles.stepperLabel}>{label}</Text>
        <Text style={styles.stepperValue}>
          {value}
          <Text style={styles.stepperUnit}> {unit}</Text>
        </Text>
      </View>
      <Pressable
        style={[styles.stepperBtn, !canInc && styles.stepperBtnDisabled]}
        onPress={onIncrement}
        disabled={!canInc}
        hitSlop={8}
      >
        <Text style={[styles.stepperBtnText, !canInc && styles.stepperBtnTextDisabled]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    backgroundColor: '#F9FAFB',
    borderColor: COLOR.divider,
  },
  // Visual "locked" state — used when recording is in progress so the row is
  // visibly disabled. Same as the toggle row's locked style.
  toggleRowLocked: {
    opacity: 0.55,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLOR.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLOR.primary,
    lineHeight: 24,
    textAlign: 'center',
  },
  stepperBtnTextDisabled: {
    color: '#9CA3AF',
  },
  stepperValueWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLOR.secondary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLOR.primary,
    fontVariant: ['tabular-nums'],
  },
  stepperUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: COLOR.secondary,
  },
});
