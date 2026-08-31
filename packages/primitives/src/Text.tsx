import type { PropsWithChildren } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'bodyLg' | 'body' | 'label' | 'caption' | 'micro';
export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'onPrimary' | 'positive' | 'warning' | 'negative' | 'info';

export interface TextProps extends PropsWithChildren, Pick<RNTextProps, 'numberOfLines' | 'ellipsizeMode' | 'accessibilityRole' | 'testID'> {
  variant?: TextVariant;
  tone?: TextTone;
  numeric?: boolean;
  align?: 'left' | 'center' | 'right';
}

export function Text({ children, variant = 'body', tone = 'primary', numeric = false, align = 'left', ...props }: TextProps) {
  return <RNText {...props} style={[styles.base, styles[variant], styles[`tone_${tone}`], styles[`align_${align}`], numeric && styles.numeric]}>{children}</RNText>;
}

const styles = StyleSheet.create((theme) => ({
  base: { color: theme.colors.text.primary, flexShrink: 1 },
  display: theme.typography.display,
  h1: theme.typography.h1,
  h2: theme.typography.h2,
  h3: theme.typography.h3,
  bodyLg: theme.typography.bodyLg,
  body: theme.typography.body,
  label: theme.typography.label,
  caption: theme.typography.caption,
  micro: theme.typography.micro,
  numeric: { fontVariant: ['tabular-nums'] },
  align_left: { textAlign: 'left' },
  align_center: { textAlign: 'center' },
  align_right: { textAlign: 'right' },
  tone_primary: { color: theme.colors.text.primary },
  tone_secondary: { color: theme.colors.text.secondary },
  tone_tertiary: { color: theme.colors.text.tertiary },
  tone_inverse: { color: theme.colors.text.inverse },
  tone_onPrimary: { color: theme.colors.interactive.onPrimary },
  tone_positive: { color: theme.colors.feedback.positive },
  tone_warning: { color: theme.colors.feedback.warning },
  tone_negative: { color: theme.colors.feedback.negative },
  tone_info: { color: theme.colors.feedback.info },
}));
