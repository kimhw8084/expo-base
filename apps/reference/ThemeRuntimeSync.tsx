import { useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import { UnistylesRuntime } from 'react-native-unistyles';
import type { ReferenceThemeMode } from './ReferenceRuntimeSettings';

/**
 * Static web rendering always boots from the deterministic light theme.
 * Once a real platform runtime exists, synchronize Unistyles either to
 * the user's system appearance or to an explicit reference-app override.
 */
export function ThemeRuntimeSync({ mode = 'system' }: { mode?: ReferenceThemeMode }) {
  const colorScheme = useColorScheme();

  const effectiveTheme = mode === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : mode;

  useEffect(() => {
    if (UnistylesRuntime.themeName !== effectiveTheme) UnistylesRuntime.setTheme(effectiveTheme);
  }, [effectiveTheme]);

  if (Platform.OS === 'web') return null;
  return <StatusBar animated barStyle={effectiveTheme === 'dark' ? 'light-content' : 'dark-content'} />;
}
