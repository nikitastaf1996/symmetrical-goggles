/**
 * GnssPill — pill-shaped GNSS status indicator.
 *
 * Extracted from App.tsx (O8). Always visible at the top of the screen.
 * Color-coded: green = 3D fix, amber = 2D fix, red/gray = no fix.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLOR } from '../styles';
import type { GpsFixType } from '../NativeGpsRecorder';

export interface GnssPillProps {
  fixType: GpsFixType;
  accuracy: number | null;
  satellitesUsed: number;
  satellitesInView: number;
  hasFix: boolean;
}

export function GnssPill({
  fixType,
  accuracy,
  satellitesUsed,
  satellitesInView,
  hasFix,
}: GnssPillProps): React.ReactElement {
  const color = hasFix
    ? (fixType === '3D fix' ? COLOR.gnssGreen : COLOR.gnssAmber)
    : COLOR.gnssRed;

  // Build the detail text: "3D · 4 m · 9 СПУТ" or "НЕТ СИГНАЛА · 0/12"
  let detail: string;
  if (hasFix) {
    const parts: string[] = [fixType.toUpperCase()];
    if (accuracy != null) parts.push(`${accuracy.toFixed(0)} м`);
    parts.push(`${satellitesUsed} СПУТ`);
    detail = parts.join(' · ');
  } else {
    detail = 'НЕТ СИГНАЛА' + (satellitesInView > 0 ? ` · ${satellitesUsed}/${satellitesInView}` : '');
  }

  return (
    <View style={styles.gnssPillWrap}>
      <View style={[styles.gnssPill, { borderColor: color }]}>
        <View style={[styles.gnssDot, { backgroundColor: color }]} />
        <Text style={styles.gnssText}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gnssPillWrap: { alignItems: 'center', marginBottom: 24 },
  gnssPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  gnssDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  gnssText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR.primary,
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
  },
});
