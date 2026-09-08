import { AdaptiveGrid, AdaptiveGridItem, Card, Chip, HStack, Text, usePrecisionI18n, VStack } from '@precision-calm/ui';
import { useReferenceRuntimeSettings, type ReferenceLocale, type ReferenceMotionMode, type ReferenceThemeMode } from './ReferenceRuntimeSettings';

const themes: readonly ReferenceThemeMode[] = ['system', 'light', 'dark'];
const locales: readonly ReferenceLocale[] = ['en-US', 'en-XA', 'en-XB'];
const motionModes: readonly ReferenceMotionMode[] = ['system', 'reduced'];

export function ReferenceRuntimeControls() {
  const { themeMode, setThemeMode, density, setDensity, locale, setLocale, motionMode, setMotionMode } = useReferenceRuntimeSettings();
  const { direction, pseudoLocale, t } = usePrecisionI18n();
  return (
    <Card>
      <VStack gap="lg">
        <VStack gap="xs">
          <Text variant="h3">{t('reference.runtime.title', undefined, 'Runtime controls')}</Text>
          <Text tone="secondary">{t('reference.runtime.description', undefined, 'Switch theme, density, locale direction, and motion policy live. Geometry remains token-owned; density never reduces interaction safety.')}</Text>
        </VStack>
        <AdaptiveGrid>
          <AdaptiveGridItem>
            <VStack gap="sm">
              <Text variant="label">Theme</Text>
              <HStack gap="xs">
                {themes.map((mode) => <Chip key={mode} label={capitalize(mode)} accessibilityLabel={`Theme: ${capitalize(mode)}`} selected={themeMode === mode} onPress={() => setThemeMode(mode)} />)}
              </HStack>
            </VStack>
          </AdaptiveGridItem>
          <AdaptiveGridItem>
            <VStack gap="sm">
              <Text variant="label">Density</Text>
              <HStack gap="xs">
                <Chip label="Comfortable" accessibilityLabel="Density: Comfortable" selected={density === 'comfortable'} onPress={() => setDensity('comfortable')} />
                <Chip label="Compact" accessibilityLabel="Density: Compact" selected={density === 'compact'} onPress={() => setDensity('compact')} />
              </HStack>
            </VStack>
          </AdaptiveGridItem>
          <AdaptiveGridItem>
            <VStack gap="sm">
              <Text variant="label">Locale stress</Text>
              <HStack gap="xs">
                {locales.map((candidate) => <Chip key={candidate} label={localeLabel(candidate)} accessibilityLabel={`Locale: ${localeLabel(candidate)}`} selected={locale === candidate} onPress={() => setLocale(candidate)} />)}
              </HStack>
            </VStack>
          </AdaptiveGridItem>
          <AdaptiveGridItem>
            <VStack gap="sm">
              <Text variant="label">Motion</Text>
              <HStack gap="xs">
                {motionModes.map((candidate) => <Chip key={candidate} label={candidate === 'reduced' ? 'Reduced motion' : 'System motion'} accessibilityLabel={`Motion: ${candidate === 'reduced' ? 'Reduced' : 'System'}`} selected={motionMode === candidate} onPress={() => setMotionMode(candidate)} />)}
              </HStack>
            </VStack>
          </AdaptiveGridItem>
        </AdaptiveGrid>
        <Text testID="runtime-settings-status" variant="caption" tone="secondary">Active: {capitalize(themeMode)} theme · {capitalize(density)} density · {locale} · {direction.toUpperCase()} · {motionMode} motion</Text>
        <Text testID="runtime-locale-status" variant="caption" tone="secondary">Locale mode: {pseudoLocale ? 'Pseudo-localized stress copy' : 'Product locale'} · Direction: {direction.toUpperCase()}</Text>
      </VStack>
    </Card>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function localeLabel(locale: ReferenceLocale) {
  return locale === 'en-XA' ? 'Pseudo LTR' : locale === 'en-XB' ? 'Pseudo RTL' : 'English';
}
