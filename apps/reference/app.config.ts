export default {
  name: 'Expo Base Reference',
  slug: 'expo-base-reference',
  version: '1.0.0',
  orientation: 'default',
  scheme: 'expo-base',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.expobase.reference',
  },
  android: {
    package: 'com.expobase.reference',
  },
  extra: {
    eas: {
      projectId: '81b044d3-0378-4ed6-9f65-6533f0a818ac',
    },
  },
  web: {
    output: 'static',
    bundler: 'metro',
  },
  plugins: [['expo-router', { asyncRoutes: { web: 'production' } }]],
  experiments: {
    typedRoutes: true,
  },
};
