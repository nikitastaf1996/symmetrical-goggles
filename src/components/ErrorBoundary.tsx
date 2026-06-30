/**
 * ErrorBoundary — top-level React error boundary (O13).
 *
 * A JS crash from a malformed native event payload would otherwise show the
 * React Native red screen of death in dev and a blank screen in release.
 * This boundary catches the error, shows a Russian recovery screen, and
 * lets the user retry by clearing the error state.
 *
 * Error boundaries MUST be class components — React does not yet support
 * getDerivedStateFromError / componentDidCatch in function components.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { COLOR } from '../styles';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console for debugging. In release this is stripped by ProGuard
    // on the Kotlin side; on the JS side Hermes still captures it for
    // Flipper / logcat.
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Что-то пошло не так</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? 'Неизвестная ошибка'}
          </Text>
          <Text style={styles.hint}>
            Нажмите «Перезапустить», чтобы сбросить состояние. Если ошибка
            повторяется, попробуйте остановить запись и запустить заново.
          </Text>
          <Button
            title="Перезапустить"
            onPress={this.handleReset}
            color={COLOR.primary}
          />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLOR.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLOR.errorText,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: undefined,
  },
  hint: {
    fontSize: 12,
    color: COLOR.secondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 18,
  },
});
