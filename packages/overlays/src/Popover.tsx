import type { ComponentRef, ReactNode } from 'react';
import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet as RNStyleSheet, useWindowDimensions, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { solveAnchoredOverlay, type AnchoredOverlayPlacement, type Rect } from '@precision-calm/platform';
import { usePrecisionDirection } from '@precision-calm/i18n';
import { useOverlayLifecycle } from './useOverlayLifecycle';
import { ModalSurface } from './ModalSurface';

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: ReactNode;
  children: ReactNode;
  placement?: AnchoredOverlayPlacement;
  accessibilityLabel?: string;
  matchAnchorWidth?: boolean;
  restoreFocusId?: string;
}

export function Popover({ open, onOpenChange, anchor, children, placement = 'bottom-start', accessibilityLabel = 'Popover', matchAnchorWidth = false, restoreFocusId }: PopoverProps) {
  const anchorRef = useRef<ComponentRef<typeof View>>(null);
  const anchorId = `precision-popover-anchor-${useId().replaceAll(':', '')}`;
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const [persistentBottomInset, setPersistentBottomInset] = useState(0);
  const viewport = useWindowDimensions();
  const { theme, rt } = useUnistyles();
  const direction = usePrecisionDirection();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useOverlayLifecycle(open, close, { restoreFocusRef: anchorRef, restoreFocusId: restoreFocusId ?? anchorId });

  const measureAnchor = useCallback(() => {
    if (!open) return;
    anchorRef.current?.measureInWindow((x, y, width, height) => setAnchorRect({ x, y, width, height }));
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    measureAnchor();
    if (typeof document !== 'undefined') {
      const navigation = document.getElementById('precision-bottom-navigation');
      const rect = navigation?.getBoundingClientRect();
      setPersistentBottomInset(rect && rect.height > 0 && rect.top < viewport.height && rect.bottom > 0 ? Math.max(0, viewport.height - rect.top) : 0);
    }
  }, [measureAnchor, open, viewport.height, viewport.width]);

  const measuredOverlay = anchorRect && matchAnchorWidth ? { ...overlaySize, width: anchorRect.width } : overlaySize;
  const insets = { ...rt.insets, bottom: Math.max(rt.insets.bottom, persistentBottomInset) };
  const result = anchorRect && measuredOverlay.width > 0 && measuredOverlay.height > 0
    ? solveAnchoredOverlay({ anchor: anchorRect, overlay: measuredOverlay, viewport, insets, preferred: placement, gap: theme.spacing.sm, margin: theme.spacing.sm, direction })
    : null;

  return (
    <>
      <View ref={anchorRef} nativeID={anchorId} collapsable={false} onLayout={measureAnchor}>{anchor}</View>
      <ModalSurface visible={open} animationType="none" onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden tabIndex={-1} style={styles.backdrop} onPress={close} />
          <ScrollView
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
            testID="precision-popover-panel"
            showsVerticalScrollIndicator={false}
            onLayout={(event) => setOverlaySize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
            style={[
              styles.panel,
              result ? { left: result.x, top: result.y, width: matchAnchorWidth && anchorRect ? Math.min(anchorRect.width, result.maxWidth) : undefined, maxWidth: result.maxWidth, maxHeight: result.maxHeight, opacity: 1 } : styles.measuring,
            ]}
          >
            {children}
          </ScrollView>
        </View>
      </ModalSurface>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  modalRoot: { flex: 1, minWidth: 0 },
  backdrop: { ...RNStyleSheet.absoluteFill, backgroundColor: theme.colors.transparent },
  panel: { position: 'absolute', minWidth: theme.componentMetrics.menuMinWidth, backgroundColor: theme.colors.background.elevated, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.default, borderRadius: theme.radii.md, ...theme.elevation.high },
  measuring: { left: 0, top: 0, maxWidth: theme.contentWidths.form, opacity: 0 },
}));
