/**
 * Stable application-facing UI facade.
 *
 * Product feature code should prefer this package over importing internal
 * presentation packages directly. Configuration/build-time code may still
 * import @expo-base/tokens, adapters, and router adapters explicitly.
 */
export * from '@expo-base/accessibility';
export * from '@expo-base/components';
export * from '@expo-base/data-display';
export * from '@expo-base/feedback';
export * from '@expo-base/forms';
export * from '@expo-base/i18n';
export * from '@expo-base/icons';
export * from '@expo-base/layouts';
export * from '@expo-base/media-presentation';
export * from '@expo-base/lists';
export * from '@expo-base/motion';
export * from '@expo-base/navigation';
export * from '@expo-base/overlays';
export * from '@expo-base/patterns';
export * from '@expo-base/primitives';
export * from '@expo-base/visualization';
export * from './legacy-compat';
