import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  comparePrecisionLocale,
  detectPrecisionLocale,
  detectPrecisionTimeZone,
  formatPrecisionCurrency,
  formatPrecisionDate,
  formatPrecisionMessage,
  formatPrecisionNumber,
  formatPrecisionPercent,
  isPrecisionPseudoLocale,
  normalizePrecisionLocale,
  precisionLocaleDirection,
  pseudoLocalize,
  resolvePrecisionMessage,
  type PrecisionDirection,
  type PrecisionDirectionPreference,
  type PrecisionMessageCatalog,
  type PrecisionMessageValues,
} from './locale';

export interface PrecisionI18nOptions {
  locale?: string;
  fallbackLocale?: string;
  direction?: PrecisionDirectionPreference;
  timeZone?: string;
  messages?: PrecisionMessageCatalog;
}

export interface PrecisionI18nValue {
  locale: string;
  fallbackLocale: string;
  direction: PrecisionDirection;
  timeZone?: string;
  pseudoLocale: boolean;
  t: (key: string, values?: PrecisionMessageValues, fallback?: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency: string, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
  compare: (left: string, right: string, options?: Intl.CollatorOptions) => number;
}

const defaultValue: PrecisionI18nValue = createValue({ locale: detectPrecisionLocale() });
const PrecisionI18nContext = createContext<PrecisionI18nValue>(defaultValue);

export function PrecisionI18nProvider({ children, ...options }: PropsWithChildren<PrecisionI18nOptions>) {
  const value = useMemo(() => createValue(options), [options.direction, options.fallbackLocale, options.locale, options.messages, options.timeZone]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const target = globalThis as unknown as { document?: { documentElement?: { dir: string; lang: string } } };
    const root = target.document?.documentElement;
    if (!root) return;
    const previous = { dir: root.dir, lang: root.lang };
    root.dir = value.direction;
    root.lang = value.locale;
    return () => {
      root.dir = previous.dir;
      root.lang = previous.lang;
    };
  }, [value.direction, value.locale]);

  return (
    <PrecisionI18nContext.Provider value={value}>
      <View style={[styles.root, value.direction === 'rtl' ? styles.rtl : styles.ltr]}>{children}</View>
    </PrecisionI18nContext.Provider>
  );
}

export function usePrecisionI18n(): PrecisionI18nValue {
  return useContext(PrecisionI18nContext);
}

export function usePrecisionDirection(): PrecisionDirection {
  return usePrecisionI18n().direction;
}

function createValue(options: PrecisionI18nOptions): PrecisionI18nValue {
  const fallbackLocale = normalizePrecisionLocale(options.fallbackLocale ?? 'en-US');
  const locale = normalizePrecisionLocale(options.locale ?? detectPrecisionLocale(fallbackLocale), fallbackLocale);
  const direction = options.direction && options.direction !== 'auto' ? options.direction : precisionLocaleDirection(locale);
  const pseudoLocale = isPrecisionPseudoLocale(locale);
  const timeZone = options.timeZone ?? detectPrecisionTimeZone();
  const formatDate = (value: Date | number | string, dateOptions?: Intl.DateTimeFormatOptions) => formatPrecisionDate(value, locale, timeZone ? { timeZone, ...dateOptions } : dateOptions);

  return {
    locale,
    fallbackLocale,
    direction,
    ...(timeZone ? { timeZone } : {}),
    pseudoLocale,
    t: (key, values, fallback) => {
      const message = resolvePrecisionMessage(options.messages, key, locale, fallbackLocale) ?? fallback ?? key;
      const localized = formatPrecisionMessage(message, locale, values);
      return pseudoLocale ? pseudoLocalize(localized, direction) : localized;
    },
    formatNumber: (value, formatOptions) => formatPrecisionNumber(value, locale, formatOptions),
    formatCurrency: (value, currency, formatOptions) => formatPrecisionCurrency(value, currency, locale, formatOptions),
    formatPercent: (value, formatOptions) => formatPrecisionPercent(value, locale, formatOptions),
    formatDate,
    compare: (left, right, collatorOptions) => comparePrecisionLocale(left, right, locale, collatorOptions),
  };
}

const styles = StyleSheet.create(() => ({
  root: { flex: 1, minWidth: 0 },
  ltr: { direction: 'ltr' },
  rtl: { direction: 'rtl' },
}));
