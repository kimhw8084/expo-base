import type { ExpoConfig } from 'expo/config';
import { referenceBrand } from './brand';

const config: ExpoConfig = {
  name: referenceBrand.name,
  slug: 'expo-base-reference',
  version: '0.1.0',
  orientation: 'default',
  scheme: 'expo-base',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: { bundleIdentifier: 'com.expobase.reference' },
  android: { package: 'com.expobase.reference' },
  web: {
    output: 'static',
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
