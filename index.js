/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// O13: wrap the root component in an ErrorBoundary so a JS crash from a
// malformed native event payload shows a recovery screen instead of the
// red screen of death (dev) / blank screen (release).
import { ErrorBoundary } from './src/components/ErrorBoundary';

function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

AppRegistry.registerComponent(appName, () => Root);
