/**
 * Divider — full-width hairline divider.
 *
 * Extracted from App.tsx (O8). Self-contained.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLOR } from '../styles';

export function Divider(): React.ReactElement {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLOR.divider,
    marginVertical: 0,
  },
});
