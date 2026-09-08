import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon } from '@precision-calm/icons';
import { Text } from '@precision-calm/primitives';
import { usePrecisionReducedMotion } from '@precision-calm/motion';

type CloseOverlay = () => void;
interface OverlayManagerValue {
  register: (id: string, close: CloseOverlay) => void;
  unregister: (id: string) => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
  mayRestoreFocus: (id: string) => boolean;
}
const OverlayManagerContext = createContext<OverlayManagerValue | null>(null);

export function OverlayRootProvider({ children }: PropsWithChildren) {
  const { theme } = useUnistyles();
  const reducedMotion = usePrecisionReducedMotion();
  const activeRef = useRef<{ id: string; close: CloseOverlay } | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef(0);

  const register = useCallback((id: string, close: CloseOverlay) => {
    if (activeRef.current && activeRef.current.id !== id) activeRef.current.close();
    activeRef.current = { id, close };
  }, []);
  const unregister = useCallback((id: string) => { if (activeRef.current?.id === id) activeRef.current = null; }, []);
  const mayRestoreFocus = useCallback((id: string) => !activeRef.current || activeRef.current.id === id, []);
  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToast(null);
  }, []);
  const showToast = useCallback((message: string) => {
    const normalized = message.trim();
    if (!normalized) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastId.current += 1;
    setToast({ id: toastId.current, message: normalized });
    toastTimer.current = setTimeout(() => {
      toastTimer.current = null;
      setToast(null);
    }, theme.feedbackTiming.toastVisible);
    }, [theme.feedbackTiming.toastVisible]);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = null;
    activeRef.current = null;
  }, []);
  const value = useMemo(() => ({ register, unregister, showToast, dismissToast, mayRestoreFocus }), [dismissToast, mayRestoreFocus, register, showToast, unregister]);

  return (
    <OverlayManagerContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {toast ? (
          <View pointerEvents="box-none" style={styles.toastLayer}>
            <View style={styles.toast} accessibilityLiveRegion="polite">
              <View style={styles.toastBody}>
                <View style={styles.toastCopy}><Text variant="label" tone="inverse">{toast.message}</Text></View>
                <Pressable accessibilityRole="button" role="button" accessibilityLabel="Dismiss notification" aria-label="Dismiss notification" onPress={dismissToast} style={({ pressed }) => [styles.toastClose, pressed && styles.toastClosePressed]}>
                  <Icon name="close" size="sm" tone="inverse" />
                </Pressable>
              </View>
              <ToastLifetime key={toast.id} duration={theme.feedbackTiming.toastVisible} reducedMotion={reducedMotion} />
            </View>
          </View>
        ) : null}
      </View>
    </OverlayManagerContext.Provider>
  );
}

function ToastLifetime({ duration, reducedMotion }: { duration: number; reducedMotion: boolean }) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reducedMotion) return;
    progress.setValue(1);
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [duration, progress, reducedMotion]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View testID="toast-lifetime" style={styles.toastLifetimeTrack} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {!reducedMotion ? <Animated.View style={[styles.toastLifetimeValue, { width }]} /> : null}
    </View>
  );
}

export function useOverlayManager() {
  const value = useContext(OverlayManagerContext);
  if (!value) throw new Error('Overlay components require OverlayRootProvider at the application root.');
  return value;
}

const styles = StyleSheet.create((theme, rt) => ({
  root: { flex: 1, minWidth: 0, position: 'relative' },
  toastLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: rt.insets.bottom + theme.spacing.xl,
    zIndex: theme.layers.toast,
    alignItems: 'center',
    paddingLeft: rt.insets.left + theme.spacing.lg,
    paddingRight: rt.insets.right + theme.spacing.lg,
  },
  toast: {
    width: '100%',
    maxWidth: theme.feedbackMetrics.toastMaxWidth,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.inverse,
    ...theme.elevation.high,
  },
  toastBody: {
    minHeight: theme.controlHeights.lg,
    paddingStart: theme.spacing.lg,
    paddingEnd: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  toastCopy: { minWidth: 0, flex: 1 },
  toastClose: {
    width: theme.controlHeights.md,
    height: theme.controlHeights.md,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.sm,
  },
  toastClosePressed: { opacity: theme.interactionFeedback.pressedOpacity },
  toastLifetimeTrack: { height: theme.feedbackMetrics.toastProgressHeight, width: '100%', backgroundColor: theme.colors.text.tertiary },
  toastLifetimeValue: { height: theme.feedbackMetrics.toastProgressHeight, backgroundColor: theme.colors.interactive.primary },
}));
