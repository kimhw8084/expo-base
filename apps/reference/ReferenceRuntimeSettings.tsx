import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { ExpoBaseDensity } from '@expo-base/ui';

export type ReferenceThemeMode = 'system' | 'light' | 'dark';
export type ReferenceLocale = 'en-US' | 'en-XA' | 'en-XB';
export type ReferenceMotionMode = 'system' | 'reduced';

interface ReferenceRuntimeSettingsValue {
  themeMode: ReferenceThemeMode;
  setThemeMode: (mode: ReferenceThemeMode) => void;
  density: ExpoBaseDensity;
  setDensity: (density: ExpoBaseDensity) => void;
  locale: ReferenceLocale;
  setLocale: (locale: ReferenceLocale) => void;
  motionMode: ReferenceMotionMode;
  setMotionMode: (mode: ReferenceMotionMode) => void;
}

const ReferenceRuntimeSettingsContext = createContext<ReferenceRuntimeSettingsValue | null>(null);

export function ReferenceRuntimeSettingsProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeMode] = useState<ReferenceThemeMode>('system');
  const [density, setDensity] = useState<ExpoBaseDensity>('comfortable');
  const [locale, setLocale] = useState<ReferenceLocale>('en-US');
  const [motionMode, setMotionMode] = useState<ReferenceMotionMode>('system');
  const value = useMemo(() => ({ themeMode, setThemeMode, density, setDensity, locale, setLocale, motionMode, setMotionMode }), [density, locale, motionMode, themeMode]);
  return <ReferenceRuntimeSettingsContext.Provider value={value}>{children}</ReferenceRuntimeSettingsContext.Provider>;
}

export function useReferenceRuntimeSettings() {
  const value = useContext(ReferenceRuntimeSettingsContext);
  if (!value) throw new Error('Reference runtime settings require ReferenceRuntimeSettingsProvider.');
  return value;
}
