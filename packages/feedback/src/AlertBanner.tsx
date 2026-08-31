import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@precision-calm/icons';
import { Text, VStack } from '@precision-calm/primitives';

export type AlertTone = 'info' | 'positive' | 'warning' | 'negative';
export interface AlertBannerProps { tone?: AlertTone | undefined; title: string; message?: string | undefined; action?: ReactNode | undefined; icon?: IconName | undefined; }

export function AlertBanner({ tone = 'info', title, message, action, icon }: AlertBannerProps) {
  const resolvedIcon = icon ?? (tone === 'positive' ? 'check' : tone === 'warning' || tone === 'negative' ? 'warning' : 'info');
  return <View accessibilityRole={tone === 'negative' ? 'alert' : undefined} style={[styles.base, styles[`tone_${tone}`]]}><View style={styles.icon}><Icon name={resolvedIcon} tone={tone} size="sm" /></View><VStack gap="xs"><Text variant="label" tone={tone}>{title}</Text>{message ? <Text variant="caption" tone="secondary">{message}</Text> : null}</VStack><View style={styles.spacer} />{action}</View>;
}

export function InlineMessage({ tone = 'info', children }: { tone?: AlertTone; children: string }) {
  return <View style={styles.inline}><Icon name={tone === 'positive' ? 'check' : tone === 'warning' || tone === 'negative' ? 'warning' : 'info'} tone={tone} size="xs" /><Text variant="caption" tone={tone}>{children}</Text></View>;
}

const styles=StyleSheet.create((theme)=>({
  base:{minWidth:0,flexDirection:'row',alignItems:'flex-start',gap:theme.spacing.md,padding:theme.spacing.md,borderRadius:theme.radii.md,borderWidth:1},
  icon:{width:theme.feedbackMetrics.bannerIconBox,height:theme.feedbackMetrics.bannerIconBox,alignItems:'center',justifyContent:'center'},
  spacer:{flex:1},
  tone_info:{backgroundColor:theme.colors.feedback.infoSurface,borderColor:theme.colors.feedback.infoSurface},
  tone_positive:{backgroundColor:theme.colors.feedback.positiveSurface,borderColor:theme.colors.feedback.positiveSurface},
  tone_warning:{backgroundColor:theme.colors.feedback.warningSurface,borderColor:theme.colors.feedback.warningSurface},
  tone_negative:{backgroundColor:theme.colors.feedback.negativeSurface,borderColor:theme.colors.feedback.negativeSurface},
  inline:{minWidth:0,flexDirection:'row',alignItems:'center',gap:theme.spacing.sm},
}));
