import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@precision-calm/primitives';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
  return (
    <View accessibilityRole="image" accessibilityLabel={`${name} avatar`} style={[styles.base, styles[size]]}>
      <Text variant={size === 'lg' ? 'label' : 'micro'}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  sm: { width: theme.controlHeights.sm, height: theme.controlHeights.sm },
  md: { width: theme.controlHeights.md, height: theme.controlHeights.md },
  lg: { width: theme.controlHeights.lg, height: theme.controlHeights.lg },
}));
