import type { ComponentRef, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet as RNStyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';
import { usePrecisionReducedMotion } from '@precision-calm/motion';
import { useOverlayLifecycle } from './useOverlayLifecycle';
import { ModalSurface } from './ModalSurface';

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
}

export function BottomSheet({ open, onOpenChange, title, children, footer, dismissOnBackdrop = true, dismissOnEscape = true }: BottomSheetProps) {
  const { theme } = useUnistyles();
  const reduceMotion = usePrecisionReducedMotion();
  const [present, setPresent] = useState(open);
  const [sheetHeight, setSheetHeight] = useState(0);
  const translateY = useRef(new Animated.Value(open ? 1000 : 0)).current;
  const panelRef = useRef<ComponentRef<typeof View>>(null);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useOverlayLifecycle(present, close, { dismissOnEscape, trapFocus: true, containerRef: panelRef });

  useEffect(() => {
    if (open) {
      translateY.stopAnimation();
      if (reduceMotion) translateY.setValue(0);
      else translateY.setValue(Math.max(sheetHeight, 1000));
      setPresent(true);
      return;
    }

    if (!present) return;
    translateY.stopAnimation();
    if (reduceMotion) {
      setPresent(false);
      return;
    }
    Animated.timing(translateY, {
      toValue: Math.max(sheetHeight, 1000),
      duration: theme.motion.duration.fast,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => { if (finished) setPresent(false); });
  }, [open, present, reduceMotion, sheetHeight, theme.motion.duration.fast, translateY]);

  useEffect(() => {
    if (!open || !present || sheetHeight <= 0 || reduceMotion) return;
    translateY.stopAnimation();
    translateY.setValue(sheetHeight);
    Animated.timing(translateY, {
      toValue: 0,
      duration: theme.motion.duration.normal,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [open, present, reduceMotion, sheetHeight, theme.motion.duration.normal, translateY]);

  const recordSheetHeight = useCallback((event: LayoutChangeEvent) => {
    const next = Math.ceil(event.nativeEvent.layout.height);
    if (next > 0 && next !== sheetHeight) setSheetHeight(next);
  }, [sheetHeight]);

  return (
    <ModalSurface visible={present} lockBackground animationType="none" onRequestClose={() => { if (dismissOnEscape) close(); }}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole={dismissOnBackdrop ? 'button' : undefined}
          role={dismissOnBackdrop ? 'button' : undefined}
          accessibilityLabel={dismissOnBackdrop ? 'Dismiss sheet' : undefined}
          aria-label={dismissOnBackdrop ? 'Dismiss sheet' : undefined}
          aria-disabled={!dismissOnBackdrop}
          disabled={!dismissOnBackdrop}
          tabIndex={-1}
          testID="bottom-sheet-backdrop"
          style={styles.backdrop}
          onPress={close}
        />
        <Animated.View
          ref={panelRef}
          accessible
          accessibilityLabel={title ?? 'Bottom sheet'}
          accessibilityViewIsModal
          aria-modal
          role="dialog"
          tabIndex={-1}
          testID="bottom-sheet-panel"
          onLayout={recordSheetHeight}
          style={[styles.sheet, { transform: [{ translateY }], opacity: sheetHeight > 0 || reduceMotion ? 1 : 0 }]}
        >
          <View style={styles.handle} />
          {title ? <Text variant="h3">{title}</Text> : null}
          <ScrollView
            testID="bottom-sheet-scroll"
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <VStack gap="lg">{children}</VStack>
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </ModalSurface>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: { flex: 1, minWidth: 0, justifyContent: 'flex-end' },
  backdrop: { ...RNStyleSheet.absoluteFill, backgroundColor: theme.colors.background.scrim },
  sheet: {
    minWidth: 0,
    width: { compact: '100%', expanded: theme.componentMetrics.sheetMaxWidth },
    maxWidth: '100%',
    alignSelf: 'center',
    maxHeight: theme.componentMetrics.sheetMaxHeight,
    paddingTop: theme.spacing.md,
    paddingLeft: rt.insets.left + theme.spacing.lg,
    paddingRight: rt.insets.right + theme.spacing.lg,
    paddingBottom: rt.insets.bottom + theme.spacing.xl,
    gap: theme.spacing.lg,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    backgroundColor: theme.colors.background.elevated,
    ...theme.elevation.high,
  },
  scroll: { minWidth: 0, flexShrink: 1 },
  scrollContent: { minWidth: 0, paddingBottom: theme.spacing.xs },
  footer: { minWidth: 0, flexShrink: 0 },
  handle: {
    alignSelf: 'center',
    width: theme.componentMetrics.sheetHandleWidth,
    height: theme.componentMetrics.sheetHandleHeight,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border.strong,
  },
}));
