import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { Modal, Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';
import { useOverlayLifecycle } from './useOverlayLifecycle';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | undefined;
  children?: ReactNode;
  actions?: ReactNode;
  dismissOnBackdrop?: boolean;
  kind?: 'dialog' | 'alert';
}
export function Dialog({ open, onOpenChange, title, description, children, actions, dismissOnBackdrop = true, kind = 'dialog' }: DialogProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useOverlayLifecycle(open, close);
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root}>
        <Pressable accessibilityLabel={dismissOnBackdrop ? 'Dismiss dialog' : undefined} disabled={!dismissOnBackdrop} style={styles.backdrop} onPress={close} />
        <View accessibilityViewIsModal accessibilityRole={kind === 'alert' ? 'alert' : undefined} style={styles.panel}>
          <VStack gap="lg"><VStack gap="xs"><Text variant="h3">{title}</Text>{description ? <Text tone="secondary">{description}</Text> : null}</VStack>{children}{actions ? <View style={styles.actions}>{actions}</View> : null}</VStack>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  backdrop: { ...RNStyleSheet.absoluteFillObject, backgroundColor: theme.colors.background.scrim },
  panel: { width: '100%', maxWidth: theme.componentMetrics.dialogMaxWidth, backgroundColor: theme.colors.background.elevated, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radii.lg, padding: theme.spacing.xl, ...theme.elevation.high },
  actions: { minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: theme.spacing.sm },
}));
