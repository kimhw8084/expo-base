import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface FormScreenProps extends PropsWithChildren {
  safeArea?: 'none' | 'top' | 'bottom' | 'all';
  showKeyboardToolbar?: boolean;
  /** A persistent action region, normally a StickyActionBar containing FormActions. */
  footer?: ReactNode | undefined;
}

export function FormScreen({ children, safeArea = 'all', showKeyboardToolbar = true, footer }: FormScreenProps) {
  const { theme, rt } = useUnistyles();
  const nativeKeyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag';
  const keyboardDismissMode = Platform.OS === 'web' ? 'none' : nativeKeyboardDismissMode;
  return (
    <View role="main" style={[styles.screen, styles[`safe_${safeArea}`]]}>
      <KeyboardAwareScrollView
        bottomOffset={theme.controlHeights.lg + theme.spacing.lg}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={keyboardDismissMode}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>
      {footer}
      {showKeyboardToolbar && Platform.OS !== 'web' ? <KeyboardToolbar insets={{ left: rt.insets.left, right: rt.insets.right }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: { flex: 1, minWidth: 0, backgroundColor: theme.colors.background.canvas },
  content: { flexGrow: 1, width: '100%', minWidth: 0, paddingHorizontal: { compact: theme.spacing.lg, medium: theme.spacing.xl, expanded: theme.spacing.xxl, wide: theme.spacing.xxxl }, paddingTop: { compact: theme.spacing.xl, expanded: theme.spacing.xxl }, paddingBottom: theme.spacing.massive },
  safe_none: {}, safe_top: { paddingTop: rt.insets.top }, safe_bottom: { paddingBottom: rt.insets.bottom },
  safe_all: { paddingTop: rt.insets.top, paddingBottom: rt.insets.bottom, paddingLeft: rt.insets.left, paddingRight: rt.insets.right },
}));
