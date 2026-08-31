import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@precision-calm/primitives';

type Tone = 'neutral' | 'positive' | 'warning' | 'negative' | 'info';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return <View style={[styles.base, styles[tone]]}><Text variant="micro" tone={tone === 'neutral' ? 'secondary' : tone}>{label}</Text></View>;
}

const styles = StyleSheet.create((theme) => ({
  base: { minHeight: theme.componentMetrics.badgeHeight, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.full, justifyContent: 'center', alignSelf: 'flex-start' },
  neutral: { backgroundColor: theme.colors.background.subtle },
  positive: { backgroundColor: theme.colors.feedback.positiveSurface },
  warning: { backgroundColor: theme.colors.feedback.warningSurface },
  negative: { backgroundColor: theme.colors.feedback.negativeSurface },
  info: { backgroundColor: theme.colors.feedback.infoSurface },
}));
