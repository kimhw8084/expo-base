import type { ComponentRef, ReactNode } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet as RNStyleSheet, useWindowDimensions, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { solveAnchoredOverlay, type AnchoredOverlayPlacement, type Rect } from '@precision-calm/platform';
import { useOverlayLifecycle } from './useOverlayLifecycle';

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: ReactNode;
  children: ReactNode;
  placement?: AnchoredOverlayPlacement;
  accessibilityLabel?: string;
}

export function Popover({ open, onOpenChange, anchor, children, placement = 'bottom-start', accessibilityLabel = 'Popover' }: PopoverProps) {
  const anchorRef = useRef<ComponentRef<typeof View>>(null);
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const viewport = useWindowDimensions();
  const { theme, rt } = useUnistyles();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useOverlayLifecycle(open, close);

  useLayoutEffect(() => {
    if (!open) return;
    anchorRef.current?.measureInWindow((x, y, width, height) => setAnchorRect({ x, y, width, height }));
  }, [open, viewport.height, viewport.width]);

  const result = anchorRect && overlaySize.width > 0 && overlaySize.height > 0
    ? solveAnchoredOverlay({ anchor: anchorRect, overlay: overlaySize, viewport, insets: rt.insets, preferred: placement, gap: theme.spacing.sm, margin: theme.spacing.sm })
    : null;

  return (
    <>
      <View ref={anchorRef} collapsable={false}>{anchor}</View>
      <Modal visible={open} transparent animationType="none" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Dismiss popover" style={styles.backdrop} onPress={close} />
          <ScrollView
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
            showsVerticalScrollIndicator={false}
            onLayout={(event) => setOverlaySize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
            style={[
              styles.panel,
              result ? { left: result.x, top: result.y, maxWidth: result.maxWidth, maxHeight: result.maxHeight, opacity: 1 } : styles.measuring,
            ]}
          >
            {children}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  modalRoot: { flex: 1, minWidth: 0 },
  backdrop: { ...RNStyleSheet.absoluteFillObject, backgroundColor: theme.colors.transparent },
  panel: { position: 'absolute', minWidth: theme.componentMetrics.menuMinWidth, backgroundColor: theme.colors.background.elevated, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radii.md, ...theme.elevation.high },
  measuring: { left: 0, top: 0, maxWidth: theme.contentWidths.form, opacity: 0 },
}));
