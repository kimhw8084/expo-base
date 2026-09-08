import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, CodeBlock, IconButton } from '@precision-calm/components';
import { HStack, Text, VStack } from '@precision-calm/primitives';
import { useOptionalPrecisionClipboard } from './hooks';

type CopyActionStatus = 'idle' | 'loading' | 'success' | 'error';

export type CopyableValueCopyPolicy = 'always' | 'when-revealed' | 'never';

export interface CopyButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
  errorLabel?: string;
  accessibilityLabel?: string;
  copiedAccessibilityLabel?: string;
  errorAccessibilityLabel?: string;
  disabled?: boolean;
  compact?: boolean;
  onCopied?: (() => void) | undefined;
  testID?: string;
}

/** Capability-backed copy action. It never falls back to an unsanctioned browser API. */
export function CopyButton({ value, label = 'Copy', copiedLabel = 'Copied', errorLabel = 'Copy unavailable', accessibilityLabel, copiedAccessibilityLabel, errorAccessibilityLabel, disabled = false, compact = false, onCopied, testID }: CopyButtonProps) {
  const clipboard = useOptionalPrecisionClipboard();
  const copy = useCopyAction(async () => {
    if (!clipboard) throw new Error('clipboard_not_registered');
    const availability = await clipboard.availability();
    if (availability.status !== 'available') throw new Error(`clipboard_${availability.reason}`);
    const result = await clipboard.copyText(value);
    if (result.status !== 'success') throw new Error(`clipboard_${result.status}`);
    onCopied?.();
  }, value);
  const unavailable = disabled || !value || !clipboard;
  const actionLabel = copy.status === 'success' ? copiedLabel : copy.status === 'error' ? errorLabel : label;
  const actionAccessibilityLabel = copy.status === 'success'
    ? (copiedAccessibilityLabel ?? accessibilityLabel ?? copiedLabel)
    : copy.status === 'error'
      ? (errorAccessibilityLabel ?? accessibilityLabel ?? errorLabel)
      : (accessibilityLabel ?? label);
  return (
    <View>
      {compact
        ? <IconButton icon={copy.status === 'success' ? 'check' : 'copy'} label={actionAccessibilityLabel} size="sm" variant="ghost" disabled={unavailable || copy.status === 'loading'} onPress={() => { void copy.run(); }} {...(testID ? { testID } : {})} />
        : <Button label={actionLabel} accessibilityLabel={actionAccessibilityLabel} iconStart={copy.status === 'success' ? 'check' : 'copy'} size="sm" variant="secondary" disabled={unavailable} loading={copy.status === 'loading'} onPress={() => { void copy.run(); }} {...(testID ? { testID } : {})} />}
      {copy.status === 'success' || copy.status === 'error' ? <View accessibilityLiveRegion="polite" aria-live="polite"><Text variant="micro" tone={copy.status === 'error' ? 'negative' : 'positive'}>{actionLabel}</Text></View> : null}
    </View>
  );
}

export interface CopyableValueProps {
  value: string;
  label: string;
  displayValue?: string;
  sensitive?: boolean;
  copyPolicy?: CopyableValueCopyPolicy;
  revealLabel?: string;
  hideLabel?: string;
  testID?: string;
}

/** Copyable identifiers and sensitive display values share one safe reveal/copy policy. */
export function CopyableValue({ value, label, displayValue, sensitive = false, copyPolicy = sensitive ? 'when-revealed' : 'always', revealLabel = 'Reveal', hideLabel = 'Hide', testID }: CopyableValueProps) {
  const [revealed, setRevealed] = useState(!sensitive);
  const visibleValue = revealed ? (displayValue ?? value) : maskValue(value);
  const canCopy = copyPolicy === 'always' || (copyPolicy === 'when-revealed' && revealed);
  return (
    <View testID={testID}>
      <VStack gap="sm">
        <Text variant="caption" tone="secondary">{label}</Text>
        <HStack gap="sm" justify="between" wrap={false}>
          <Text variant="code" direction="ltr" align="left" selectable={!sensitive || revealed} numberOfLines={1} ellipsizeMode="middle" accessibilityLabel={`${label}: ${sensitive && !revealed ? 'Hidden' : visibleValue}`} testID={testID ? `${testID}-value` : undefined}>{visibleValue}</Text>
          <HStack gap="xs" wrap={false}>
            {sensitive ? <Button label={revealed ? hideLabel : revealLabel} accessibilityLabel={`${revealed ? hideLabel : revealLabel} ${label}`} variant="ghost" size="sm" onPress={() => setRevealed((current) => !current)} /> : null}
            {copyPolicy !== 'never' ? <CopyButton value={value} accessibilityLabel={`Copy ${label}`} copiedAccessibilityLabel={`Copied ${label}`} errorAccessibilityLabel={`Copy ${label} unavailable`} disabled={!canCopy} compact {...(testID ? { testID: `${testID}-copy` } : {})} /> : null}
          </HStack>
        </HStack>
      </VStack>
    </View>
  );
}

export interface CopyableCodeProps {
  value: string;
  label?: string;
  wrap?: boolean;
  testID?: string;
}

export function CopyableCode({ value, label = 'Code', wrap = false, testID }: CopyableCodeProps) {
  return <CodeBlock value={value} label={label} wrap={wrap} {...(testID ? { testID } : {})} action={<CopyButton value={value} accessibilityLabel={`Copy ${label}`} copiedAccessibilityLabel={`Copied ${label}`} errorAccessibilityLabel={`Copy ${label} unavailable`} compact />} />;
}

function maskValue(value: string): string {
  const visibleTail = value.slice(-4);
  return value.length <= 4 ? '••••' : `${'•'.repeat(Math.min(8, value.length - 4))}${visibleTail}`;
}

/**
 * The sharing capability owns its action lifecycle locally so the optional
 * implementation package does not depend back on the application runtime.
 * Repeated triggers share one in-flight action and late results never commit.
 */
function useCopyAction(action: () => Promise<void>, identity: string): { status: CopyActionStatus; run: () => Promise<void> } {
  const [status, setStatus] = useState<CopyActionStatus>('idle');
  const actionRef = useRef(action);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);
  const revisionRef = useRef(0);
  actionRef.current = action;

  useEffect(() => () => {
    mountedRef.current = false;
    revisionRef.current += 1;
  }, []);

  useEffect(() => {
    revisionRef.current += 1;
    inFlightRef.current = null;
    setStatus('idle');
  }, [identity]);

  const run = useCallback(() => {
    if (inFlightRef.current) return inFlightRef.current;
    const revision = ++revisionRef.current;
    setStatus('loading');
    const pending = actionRef.current()
      .then(() => {
        if (mountedRef.current && revisionRef.current === revision) setStatus('success');
      })
      .catch(() => {
        if (mountedRef.current && revisionRef.current === revision) setStatus('error');
      })
      .finally(() => {
        if (inFlightRef.current === pending) inFlightRef.current = null;
      });
    inFlightRef.current = pending;
    return pending;
  }, []);

  return { status, run };
}
