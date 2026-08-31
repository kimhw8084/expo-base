import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@precision-calm/primitives';

type CloseOverlay = () => void;
interface OverlayManagerValue { register: (id: string, close: CloseOverlay) => void; unregister: (id: string) => void; showToast: (message: string) => void; }
const OverlayManagerContext = createContext<OverlayManagerValue | null>(null);

export function OverlayRootProvider({ children }: PropsWithChildren) {
  const { theme } = useUnistyles();
  const activeRef = useRef<{ id: string; close: CloseOverlay } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const register = useCallback((id: string, close: CloseOverlay) => {
    if (activeRef.current && activeRef.current.id !== id) activeRef.current.close();
    activeRef.current = { id, close };
  }, []);
  const unregister = useCallback((id: string) => { if (activeRef.current?.id === id) activeRef.current = null; }, []);
  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), theme.feedbackTiming.toastVisible);
  }, [theme.feedbackTiming.toastVisible]);
  const value = useMemo(() => ({ register, unregister, showToast }), [register, unregister, showToast]);

  return (
    <OverlayManagerContext.Provider value={value}>
      <View style={styles.root}>{children}{toast ? <View pointerEvents="none" style={styles.toast} accessibilityLiveRegion="polite"><Text variant="label" tone="inverse">{toast}</Text></View> : null}</View>
    </OverlayManagerContext.Provider>
  );
}

export function useOverlayManager() {
  const value = useContext(OverlayManagerContext);
  if (!value) throw new Error('Overlay components require OverlayRootProvider at the application root.');
  return value;
}

const styles = StyleSheet.create((theme, rt) => ({
  root: { flex: 1, minWidth: 0, position: 'relative' },
  toast: { position: 'absolute', left: theme.spacing.lg, right: theme.spacing.lg, bottom: rt.insets.bottom + theme.spacing.xl, zIndex: theme.layers.toast, alignSelf: 'center', maxWidth: theme.contentWidths.form, minHeight: theme.controlHeights.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background.inverse, ...theme.elevation.high },
}));
