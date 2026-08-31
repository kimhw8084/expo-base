import { StyleSheet } from 'react-native-unistyles';
import { breakpoints, createPrecisionThemes } from '@precision-calm/tokens';
import { referenceBrand } from './brand';

const themes = createPrecisionThemes(referenceBrand);
type AppThemes = typeof themes;
type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes,
  breakpoints,
  settings: {
    adaptiveThemes: true,
    nativeBreakpointsMode: 'points',
  },
});
