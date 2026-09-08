import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Badge } from '@precision-calm/components';
import { HStack, Text, VStack, useDensity } from '@precision-calm/primitives';

export type TimelineTone = 'neutral' | 'info' | 'positive' | 'warning' | 'negative';

export interface TimelineItem {
  id: string;
  title: string;
  timestamp?: string;
  description?: string;
  metadata?: ReactNode;
  action?: ReactNode;
  tone?: TimelineTone;
  statusLabel?: string;
}

export interface TimelineProps {
  items: readonly TimelineItem[];
  label?: string;
  empty?: ReactNode;
  testID?: string;
}

/** Chronological event presentation. Item order and domain meaning always remain product-owned. */
export function Timeline({ items, label = 'Activity timeline', empty = null, testID }: TimelineProps) {
  const density = useDensity();
  if (items.length === 0) return <>{empty}</>;
  return (
    <View role="list" accessibilityLabel={label} style={styles.list} testID={testID}>
      {items.map((item, index) => {
        const tone = item.tone ?? 'neutral';
        return (
          <View role="listitem" key={item.id} style={[styles.item, density === 'compact' && styles.compact]}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.rail}>
              <View style={[styles.marker, styles[`marker_${tone}`]]} />
              {index < items.length - 1 ? <View style={styles.connector} /> : null}
            </View>
            <View style={styles.content}>
              <VStack gap="sm">
                <HStack gap="sm" justify="between" align="start">
                  <View style={styles.headerContent}>
                    <VStack gap="xs">
                      <Text variant="label">{item.title}</Text>
                      {item.timestamp ? <Text variant="caption" tone="secondary">{item.timestamp}</Text> : null}
                    </VStack>
                  </View>
                  {item.statusLabel ? <Badge label={item.statusLabel} tone={tone} /> : null}
                </HStack>
                {item.description ? <Text tone="secondary">{item.description}</Text> : null}
                {item.metadata}
                {item.action ? <View style={styles.action}>{item.action}</View> : null}
              </VStack>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { minWidth: 0 },
  item: { minWidth: 0, flexDirection: 'row', gap: theme.spacing.md, paddingBottom: theme.spacing.xl },
  compact: { paddingBottom: theme.spacing.lg },
  content: { minWidth: 0, flex: 1 },
  headerContent: { minWidth: 0, flexGrow: 1, flexShrink: 1 },
  rail: { width: theme.spacing.md, alignItems: 'center', flexShrink: 0 },
  marker: { width: theme.spacing.sm, height: theme.spacing.sm, marginTop: theme.spacing.xs, borderRadius: theme.radii.full, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.strong },
  marker_neutral: { backgroundColor: theme.colors.text.tertiary },
  marker_info: { backgroundColor: theme.colors.feedback.info },
  marker_positive: { backgroundColor: theme.colors.feedback.positive },
  marker_warning: { backgroundColor: theme.colors.feedback.warning },
  marker_negative: { backgroundColor: theme.colors.feedback.negative },
  connector: { width: theme.strokeWidths.standard, flexGrow: 1, minHeight: theme.spacing.lg, marginTop: theme.spacing.xs, backgroundColor: theme.colors.border.default },
  action: { alignSelf: 'flex-start' },
}));
