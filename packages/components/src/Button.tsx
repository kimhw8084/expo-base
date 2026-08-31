import { ActivityIndicator, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon, type IconName, type IconTone } from '@precision-calm/icons';
import { Text, useInteractionState } from '@precision-calm/primitives';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', disabled = false, loading = false, iconStart, iconEnd, accessibilityLabel, testID }: ButtonProps) {
  const unavailable = disabled || loading;
  const { theme } = useUnistyles();
  const { hovered, focused, interactionProps } = useInteractionState();
  const iconTone: IconTone = variant === 'primary' || variant === 'danger' ? 'onPrimary' : 'primary';
  const iconSize = size === 'lg' ? 'md' : 'sm';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      testID={testID}
      hitSlop={size === 'sm' ? theme.interactionFeedback.compactHitSlop : undefined}
      {...interactionProps}
      style={({ pressed }) => [
        styles.base, styles[size], styles[variant],
        hovered && !unavailable && styles[`${variant}Hover`],
        focused && styles.focused,
        pressed && !unavailable && styles[`${variant}Pressed`],
        unavailable && styles.disabled,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? theme.colors.interactive.onPrimary : variant === 'danger' ? theme.colors.white : theme.colors.text.primary} /> : <>{iconStart ? <Icon name={iconStart} size={iconSize} tone={iconTone} /> : null}<Text variant="label" tone={variant === 'primary' || variant === 'danger' ? 'onPrimary' : 'primary'}>{label}</Text>{iconEnd ? <Icon name={iconEnd} size={iconSize} tone={iconTone} /> : null}</>}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: { minWidth: 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: theme.spacing.sm, borderWidth: 1 },
  sm: { minHeight: theme.controlHeights.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.sm },
  md: { minHeight: theme.controlHeights.md, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radii.sm },
  lg: { minHeight: theme.controlHeights.lg, paddingHorizontal: theme.spacing.xl, borderRadius: theme.radii.md },
  primary: { backgroundColor: theme.colors.interactive.primary, borderColor: theme.colors.interactive.primary },
  secondary: { backgroundColor: theme.colors.background.subtle, borderColor: theme.colors.border.default },
  outline: { backgroundColor: theme.colors.transparent, borderColor: theme.colors.border.strong },
  ghost: { backgroundColor: theme.colors.transparent, borderColor: theme.colors.transparent },
  danger: { backgroundColor: theme.colors.feedback.negative, borderColor: theme.colors.feedback.negative },
  primaryHover: { backgroundColor: theme.colors.interactive.primaryHover, borderColor: theme.colors.interactive.primaryHover },
  secondaryHover: { backgroundColor: theme.colors.interactive.subtleHover },
  outlineHover: { backgroundColor: theme.colors.background.subtle },
  ghostHover: { backgroundColor: theme.colors.background.subtle },
  dangerHover: { opacity: 0.9 },
  primaryPressed: { backgroundColor: theme.colors.interactive.primaryPressed, borderColor: theme.colors.interactive.primaryPressed },
  secondaryPressed: { backgroundColor: theme.colors.interactive.subtlePressed },
  outlinePressed: { backgroundColor: theme.colors.interactive.subtlePressed },
  ghostPressed: { backgroundColor: theme.colors.interactive.subtlePressed },
  dangerPressed: { opacity: theme.interactionFeedback.pressedOpacity },
  focused: { boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
}));
