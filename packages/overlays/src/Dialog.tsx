import type { ComponentRef, ReactNode } from 'react';
import { useCallback, useId, useRef } from 'react';
import { Platform, Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';
import { useOverlayLifecycle } from './useOverlayLifecycle';
import { usePrecisionReducedMotion } from '@precision-calm/motion';
import { ModalSurface } from './ModalSurface';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | undefined;
  children?: ReactNode;
  actions?: ReactNode;
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
  kind?: 'dialog' | 'alert';
}
export function Dialog({ open, onOpenChange, title, description, children, actions, dismissOnBackdrop = true, dismissOnEscape = dismissOnBackdrop, kind = 'dialog' }: DialogProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const panelRef = useRef<ComponentRef<typeof View>>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reducedMotion = usePrecisionReducedMotion();
  useOverlayLifecycle(open, close, { dismissOnEscape, trapFocus: true, containerRef: panelRef });
  return (
    <ModalSurface visible={open} lockBackground animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => { if (dismissOnEscape) close(); }}>
      <View style={styles.root}>
        <Pressable accessibilityLabel={dismissOnBackdrop ? 'Dismiss dialog' : undefined} disabled={!dismissOnBackdrop} tabIndex={-1} style={styles.backdrop} onPress={close} />
        <View
          ref={panelRef}
          accessible={Platform.OS === 'web'}
          accessibilityLabel={title}
          accessibilityViewIsModal
          aria-modal
          role={kind === 'alert' ? 'alertdialog' : 'dialog'}
          {...(Platform.OS === 'web' ? { 'aria-labelledby': titleId, 'aria-describedby': description ? descriptionId : undefined } : {})}
          tabIndex={-1}
          style={styles.panel}
        >
          <VStack gap="lg"><VStack gap="xs"><View nativeID={titleId}><Text variant="h3">{title}</Text></View>{description ? <View nativeID={descriptionId}><Text tone="secondary">{description}</Text></View> : null}</VStack>{children}{actions ? <View style={styles.actions}>{actions}</View> : null}</VStack>
        </View>
      </View>
    </ModalSurface>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  root: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingTop: rt.insets.top + theme.spacing.lg, paddingBottom: rt.insets.bottom + theme.spacing.lg, paddingLeft: rt.insets.left + theme.spacing.lg, paddingRight: rt.insets.right + theme.spacing.lg },
  backdrop: { ...RNStyleSheet.absoluteFill, backgroundColor: theme.colors.background.scrim },
  panel: { width: '100%', maxWidth: theme.componentMetrics.dialogMaxWidth, backgroundColor: theme.colors.background.elevated, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.default, borderRadius: theme.radii.lg, padding: theme.spacing.xl, ...theme.elevation.high },
  actions: { minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: theme.spacing.sm },
}));
