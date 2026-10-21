// Weight-specific imports: only Inter 400/500/700 are bundled to keep the APK size minimal.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Toast } from './src/components/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initRemoteConfig } from './src/services/remoteConfig';
import { AppStateProvider } from './src/state/AppState';
import { colors } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const errorUtils = (
  globalThis as {
    ErrorUtils?: {
      getGlobalHandler?: () => (e: unknown, fatal?: boolean) => void;
      setGlobalHandler?: (h: (e: unknown, fatal?: boolean) => void) => void;
    };
  }
).ErrorUtils;
const previousHandler = errorUtils?.getGlobalHandler?.();
errorUtils?.setGlobalHandler?.((error, isFatal) => {
  console.warn('Unhandled error', isFatal ? '(fatal)' : '', error);
  if (!isFatal) previousHandler?.(error, false);
});

const theme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.violet,
    background: colors.bg,
    card: colors.surface1,
    text: colors.text,
    border: 'transparent',
    notification: colors.pink,
  },
};

export default function App() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });
  const ready = loaded || !!error;

  useEffect(() => {
    initRemoteConfig().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <ErrorBoundary>
        <AppStateProvider>
          <NavigationContainer theme={theme}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
          <Toast />
        </AppStateProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
