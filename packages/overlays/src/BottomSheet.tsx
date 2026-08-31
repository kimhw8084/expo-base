import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { Modal, Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';
import { useOverlayLifecycle } from './useOverlayLifecycle';

export interface BottomSheetProps { open: boolean; onOpenChange: (open: boolean) => void; title?: string | undefined; children: ReactNode; dismissOnBackdrop?: boolean; }
export function BottomSheet({ open, onOpenChange, title, children, dismissOnBackdrop = true }: BottomSheetProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useOverlayLifecycle(open, close);
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root}>
        <Pressable accessibilityLabel={dismissOnBackdrop ? 'Dismiss sheet' : undefined} disabled={!dismissOnBackdrop} style={styles.backdrop} onPress={close} />
        <View accessibilityViewIsModal style={styles.sheet}><View style={styles.handle} />{title ? <Text variant="h3">{title}</Text> : null}<VStack gap="lg">{children}</VStack></View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  root: { flex: 1, minWidth: 0, justifyContent: 'flex-end' },
  backdrop: { ...RNStyleSheet.absoluteFillObject, backgroundColor: theme.colors.background.scrim },
  sheet: { minWidth: 0, maxHeight: theme.componentMetrics.sheetMaxHeight, paddingTop: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingBottom: rt.insets.bottom + theme.spacing.xl, gap: theme.spacing.lg, borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl, backgroundColor: theme.colors.background.elevated, ...theme.elevation.high },
  handle: { alignSelf: 'center', width: theme.componentMetrics.sheetHandleWidth, height: theme.componentMetrics.sheetHandleHeight, borderRadius: theme.radii.full, backgroundColor: theme.colors.border.strong },
}));
