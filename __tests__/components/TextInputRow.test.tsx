/**
 * Basic smoke test for TextInputRow.
 */
import React from 'react';
import { TextInputRow } from '../../src/components/TextInputRow';
import { render } from '../helpers/render';

describe('TextInputRow', () => {
  it('renders without crashing', () => {
    const root = render(
      <TextInputRow label="Test label" value="0.35" unit="м/с" onChangeText={() => {}} />
    );
    expect(root).toBeTruthy();
  });

  it('renders disabled input when disabled prop is true', () => {
    const root = render(
      <TextInputRow label="X" value="10" unit="с" disabled={true} onChangeText={() => {}} />
    );
    expect(root).toBeTruthy();
  });

  it('renders with a decimal value', () => {
    const root = render(
      <TextInputRow label="Window" value="3.5" unit="м" onChangeText={() => {}} />
    );
    expect(root).toBeTruthy();
  });
});
