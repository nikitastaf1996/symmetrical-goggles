/**
 * BigStat — large stat block (label + big numeral + optional unit).
 *
 * Extracted from App.tsx (O8). Self-contained: defines its own styles so it
 * can be reused in isolation. Visual appearance matches the original.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLOR } from '../styles';

export interface BigStatProps {
  label: string;
  value: string;
  unit?: string;
  compact?: boolean;
  valueColor?: string;
}

export function BigStat({
  label,
  value,
  unit,
  compact,
  valueColor,
}: BigStatProps): React.ReactElement {
  return (
    <View style={[styles.statBlock, compact ? styles.statBlockCompact : null]}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text
          style={[
            styles.statValue,
            compact ? styles.statValueCompact : null,
            valueColor != null ? { color: valueColor } : null,
          ]}
        >
          {value}
        </Text>
        {unit != null && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statBlock: {
    alignItems: 'center',
    paddingVertical: 22,
  },
  statBlockCompact: {
    paddingVertical: 16,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR.secondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statValue: {
    fontSize: 64,
    fontWeight: '700',
    color: COLOR.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  statValueCompact: {
    fontSize: 36,
  },
  statUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: COLOR.secondary,
  },
});
