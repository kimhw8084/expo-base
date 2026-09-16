/**
 * Migration-only aliases for the pre-CHG-24 root facade.
 *
 * These names are intentionally not used by Expo Base documentation, examples, or the
 * generator. Remove them only in a major version after downstream migrations are complete.
 */

/** @deprecated Use ExpoBaseWebAccessibilityStyles. */
export { ExpoBaseWebAccessibilityStyles as PrecisionWebAccessibilityStyles } from '@expo-base/accessibility';

/** @deprecated Use ExpoBaseCommand. */
export type { ExpoBaseCommand as PrecisionCommand } from '@expo-base/patterns';

/** @deprecated Use ExpoBaseDensity. */
export type { ExpoBaseDensity as PrecisionDensity } from '@expo-base/primitives';

/** @deprecated Use the Expo Base i18n exports. */
export {
  ExpoBaseI18nProvider as PrecisionI18nProvider,
  compareExpoBaseLocale as comparePrecisionLocale,
  detectExpoBaseLocale as detectPrecisionLocale,
  detectExpoBaseTimeZone as detectPrecisionTimeZone,
  formatExpoBaseCurrency as formatPrecisionCurrency,
  formatExpoBaseDate as formatPrecisionDate,
  formatExpoBaseEditableNumber as formatPrecisionEditableNumber,
  formatExpoBaseMessage as formatPrecisionMessage,
  formatExpoBaseNumber as formatPrecisionNumber,
  formatExpoBasePercent as formatPrecisionPercent,
  isExpoBasePseudoLocale as isPrecisionPseudoLocale,
  normalizeExpoBaseLocale as normalizePrecisionLocale,
  parseExpoBaseDecimalInput as parsePrecisionDecimalInput,
  expoBaseLocaleDirection as precisionLocaleDirection,
  expoBaseNumberSymbols as precisionNumberSymbols,
  resolveExpoBaseMessage as resolvePrecisionMessage,
  useExpoBaseDirection as usePrecisionDirection,
  useExpoBaseI18n as usePrecisionI18n,
} from '@expo-base/i18n';
/** @deprecated Use the Expo Base i18n types. */
export type {
  ExpoBaseDirection as PrecisionDirection,
  ExpoBaseDirectionPreference as PrecisionDirectionPreference,
  ExpoBaseI18nOptions as PrecisionI18nOptions,
  ExpoBaseI18nValue as PrecisionI18nValue,
  ExpoBaseMessage as PrecisionMessage,
  ExpoBaseMessageCatalog as PrecisionMessageCatalog,
  ExpoBaseMessageValues as PrecisionMessageValues,
  ExpoBasePluralMessage as PrecisionPluralMessage,
} from '@expo-base/i18n';

/** @deprecated Use ExpoBaseMotionValue and the Expo Base motion hooks. */
export { useExpoBaseMotion as usePrecisionMotion, useExpoBaseReducedMotion as usePrecisionReducedMotion } from '@expo-base/motion';
export type { ExpoBaseMotionValue as PrecisionMotionValue } from '@expo-base/motion';

/** @deprecated Use ExpoBaseSection. */
export type { ExpoBaseSection as PrecisionSection } from '@expo-base/lists';
