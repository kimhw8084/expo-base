import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface FormScreenProps extends PropsWithChildren {
  safeArea?: 'none' | 'top' | 'bottom' | 'all';
  showKeyboardToolbar?: boolean;
}

export function FormScreen({ children, safeArea = 'all', showKeyboardToolbar = true }: FormScreenProps) {
  const { theme } = useUnistyles();
  return (
    <View style={[styles.screen, styles[`safe_${safeArea}`]]}>
      <KeyboardAwareScrollView
        bottomOffset={theme.controlHeights.lg + theme.spacing.lg}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>
      {showKeyboardToolbar ? <KeyboardToolbar /> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: { flex: 1, minWidth: 0, backgroundColor: theme.colors.background.canvas },
  content: { flexGrow: 1, minWidth: 0, paddingHorizontal: { compact: theme.spacing.lg, medium: theme.spacing.xl, expanded: theme.spacing.xxl, wide: theme.spacing.xxxl }, paddingTop: { compact: theme.spacing.xl, expanded: theme.spacing.xxl }, paddingBottom: theme.spacing.massive },
  safe_none: {}, safe_top: { paddingTop: rt.insets.top }, safe_bottom: { paddingBottom: rt.insets.bottom },
  safe_all: { paddingTop: rt.insets.top, paddingBottom: rt.insets.bottom, paddingLeft: rt.insets.left, paddingRight: rt.insets.right },
}));
