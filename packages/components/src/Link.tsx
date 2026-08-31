import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@precision-calm/icons';
import { Text, useInteractionState } from '@precision-calm/primitives';

export interface LinkProps {
  label: string;
  onPress: () => void;
  iconEnd?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function Link({ label, onPress, iconEnd, disabled = false, accessibilityLabel }: LinkProps) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      {...interactionProps}
      style={({ pressed }) => [styles.base, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <Text variant="label" tone="info">{label}</Text>
      {iconEnd ? <Icon name={iconEnd} size="xs" tone="info" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: { minHeight: theme.controlHeights.sm, alignItems: 'center', flexDirection: 'row', gap: theme.spacing.xs, borderRadius: theme.radii.xs, paddingHorizontal: theme.spacing.xs },
  hovered: { backgroundColor: theme.colors.feedback.infoSurface },
  focused: { boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
}));
