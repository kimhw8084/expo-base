import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function Divider({ strength = 'subtle' }: { strength?: 'subtle' | 'default' | 'strong' }) {
  return <View accessibilityRole="none" style={[styles.base, styles[strength]]} />;
}

const styles = StyleSheet.create((theme) => ({
  base: { width: '100%', height: 1, flexShrink: 0 },
  subtle: { backgroundColor: theme.colors.border.subtle },
  default: { backgroundColor: theme.colors.border.default },
  strong: { backgroundColor: theme.colors.border.strong },
}));
