import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Card } from '@precision-calm/components';
import { HStack, Text, VStack } from '@precision-calm/primitives';

export function MetricDelta({ direction, tone = 'neutral', label }: { direction: 'up' | 'down' | 'flat'; tone?: 'positive' | 'warning' | 'negative' | 'neutral'; label: string }) {
  return <Text variant="micro" tone={tone === 'neutral' ? 'secondary' : tone}>{direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'} {label}</Text>;
}

export function MetricTrendCard({ label, value, delta, deltaDirection = 'flat', deltaTone = 'neutral', context, trend }: { label: string; value: string; delta?: string; deltaDirection?: 'up' | 'down' | 'flat'; deltaTone?: 'positive' | 'warning' | 'negative' | 'neutral'; context?: string; trend?: ReactNode }) {
  return <Card padding="compact"><VStack gap="sm"><Text variant="caption" tone="secondary">{label}</Text><Text variant="h2" numeric>{value}</Text>{delta ? <MetricDelta direction={deltaDirection} tone={deltaTone} label={delta} /> : null}{context ? <Text variant="micro" tone="secondary">{context}</Text> : null}{trend ? <View style={styles.trend}>{trend}</View> : null}</VStack></Card>;
}

export function ChartPanel({ title, description, action, summary, children, footer }: { title: string; description?: string; action?: ReactNode; summary?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return <Card><VStack gap="md"><HStack gap="md" justify="between" align="start"><VStack gap="xs"><Text variant="h3">{title}</Text>{description ? <Text variant="caption" tone="secondary">{description}</Text> : null}</VStack>{action}</HStack>{summary ? <View>{summary}</View> : null}<View style={styles.chart}>{children}</View>{footer ? <View style={styles.footer}>{footer}</View> : null}</VStack></Card>;
}

export function BreakdownPanel({ title, description, children, total }: { title: string; description?: string; children: ReactNode; total?: ReactNode }) {
  return <Card variant="subtle"><VStack gap="md"><HStack justify="between" align="start"><VStack gap="xs"><Text variant="h3">{title}</Text>{description ? <Text variant="caption" tone="secondary">{description}</Text> : null}</VStack>{total ? <Text variant="label" numeric>{total}</Text> : null}</HStack><View style={styles.divider}>{children}</View></VStack></Card>;
}

const styles = StyleSheet.create((theme) => ({
  chart: { minWidth: 0 },
  divider: { borderTopWidth: theme.strokeWidths.standard, borderTopColor: theme.colors.border.subtle, paddingTop: theme.spacing.md },
  footer: { paddingTop: theme.spacing.xs },
  trend: { minHeight: theme.visualizationMetrics.sparklineHeight },
}));
