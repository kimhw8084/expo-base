import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '@precision-calm/components';
import { Dialog } from '@precision-calm/overlays';
import { Text, VStack } from '@precision-calm/primitives';

export interface FormErrorSummaryItem {
  id: string;
  label: string;
  message: string;
  onPress?: () => void;
}

export interface FormErrorSummaryProps {
  errors: readonly FormErrorSummaryItem[];
  title?: string;
  description?: string;
  testID?: string;
}

/** A single post-submit error announcement; inline field errors remain the source of local detail. */
export function FormErrorSummary({
  errors,
  title = 'Review the highlighted fields',
  description = 'Choose an item to move to the field that needs attention.',
  testID,
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" role="alert" style={styles.summary} testID={testID}>
      <VStack gap="sm">
        <Text variant="h3" tone="negative">{title}</Text>
        <Text variant="caption" tone="secondary">{description}</Text>
        <VStack gap="xs">
          {errors.map((error) => (
            <Button
              key={error.id}
              label={`${error.label}: ${error.message}`}
              accessibilityLabel={`Go to ${error.label}: ${error.message}`}
              variant="ghost"
              responsiveWidth="compact-full"
              onPress={error.onPress ?? (() => undefined)}
            />
          ))}
        </VStack>
      </VStack>
    </View>
  );
}

export interface FormLeaveGuard {
  isDirty: boolean;
  open: boolean;
  requestLeave: (onLeave: () => void) => boolean;
  cancelLeave: () => void;
  confirmLeave: () => void;
}

export function useFormLeaveGuard({ isDirty, onDiscard }: { isDirty: boolean; onDiscard?: () => void } ): FormLeaveGuard {
  const [open, setOpen] = useState(false);
  const pendingLeave = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isDirty) return;
    pendingLeave.current = null;
    setOpen(false);
  }, [isDirty]);

  const requestLeave = useCallback((onLeave: () => void) => {
    if (!isDirty) {
      onLeave();
      return true;
    }
    pendingLeave.current = onLeave;
    setOpen(true);
    return false;
  }, [isDirty]);
  const cancelLeave = useCallback(() => {
    pendingLeave.current = null;
    setOpen(false);
  }, []);
  const confirmLeave = useCallback(() => {
    const onLeave = pendingLeave.current;
    pendingLeave.current = null;
    setOpen(false);
    onDiscard?.();
    onLeave?.();
  }, [onDiscard]);

  return { isDirty, open, requestLeave, cancelLeave, confirmLeave };
}

export interface FormDiscardDialogProps {
  guard: FormLeaveGuard;
  title?: string;
  description?: string;
  stayLabel?: string;
  discardLabel?: string;
}

/** Shared unsaved-change confirmation; product routes only supply the navigation continuation. */
export function FormDiscardDialog({
  guard,
  title = 'Discard unsaved changes?',
  description = 'Your changes have not been saved and will be lost.',
  stayLabel = 'Keep editing',
  discardLabel = 'Discard changes',
}: FormDiscardDialogProps) {
  return (
    <Dialog
      open={guard.open}
      onOpenChange={(next) => { if (!next) guard.cancelLeave(); }}
      title={title}
      description={description}
      kind="alert"
      dismissOnBackdrop={false}
      actions={(
        <View style={styles.actions}>
          <Button label={stayLabel} variant="secondary" onPress={guard.cancelLeave} />
          <Button label={discardLabel} variant="danger" onPress={guard.confirmLeave} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  summary: {
    minWidth: 0,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: theme.strokeWidths.standard,
    borderColor: theme.colors.feedback.negative,
    backgroundColor: theme.colors.feedback.negativeSurface,
  },
  actions: {
    minWidth: 0,
    flexDirection: { compact: 'column-reverse', medium: 'row' },
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
}));
