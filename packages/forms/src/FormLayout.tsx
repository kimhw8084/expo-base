import { Children, type PropsWithChildren, type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';

export interface FormSectionProps extends PropsWithChildren {
  title?: string;
  description?: string;
  eyebrow?: string | undefined;
  accessory?: ReactNode;
  testID?: string | undefined;
}

export function FormSection({ title, description, eyebrow, accessory, children, testID }: FormSectionProps) {
  const hasHeader = Boolean(eyebrow || title || description || accessory);
  return (
    <View style={styles.section} testID={testID}>
      {hasHeader ? (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <VStack gap="xs">
              {eyebrow ? <Text variant="micro" tone="secondary">{eyebrow}</Text> : null}
              {title ? <Text variant="h3" accessibilityRole="header">{title}</Text> : null}
              {description ? <Text tone="secondary">{description}</Text> : null}
            </VStack>
          </View>
          {accessory ? <View style={styles.sectionAccessory}>{accessory}</View> : null}
        </View>
      ) : null}
      <VStack gap="lg">{children}</VStack>
    </View>
  );
}

export interface FormSectionGroupProps extends PropsWithChildren {
  testID?: string | undefined;
}

export function FormSectionGroup({ children, testID }: FormSectionGroupProps) {
  return (
    <View style={styles.sectionGroup} testID={testID}>
      {Children.map(children, (child, index) => (
        <View key={index} style={[styles.sectionSlot, index > 0 && styles.sectionSeparated]}>
          {child}
        </View>
      ))}
    </View>
  );
}

export interface FormRowProps extends PropsWithChildren { testID?: string | undefined; }
export function FormRow({ children, testID }: FormRowProps) {
  return (
    <View style={styles.fieldRow} testID={testID}>
      {Children.map(children, (child, index) => <View key={index} style={styles.fieldCell}>{child}</View>)}
    </View>
  );
}

export interface FormActionsProps {
  primary: ReactNode;
  secondary?: ReactNode;
  testID?: string | undefined;
}
export function FormActions({ primary, secondary, testID }: FormActionsProps) {
  return <View style={styles.actions} testID={testID}>{secondary}{primary}</View>;
}

const styles = StyleSheet.create((theme) => ({
  section: { minWidth: 0, gap: theme.spacing.lg },
  sectionHeader: {
    minWidth: 0,
    flexDirection: { compact: 'column', medium: 'row' },
    alignItems: { compact: 'stretch', medium: 'flex-start' },
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  sectionCopy: { minWidth: 0, flex: 1, maxWidth: theme.contentWidths.reading },
  sectionAccessory: { minWidth: 0, flexShrink: 0, alignSelf: { compact: 'flex-start', medium: 'flex-start' } },
  sectionGroup: { minWidth: 0 },
  sectionSlot: { minWidth: 0 },
  sectionSeparated: {
    marginTop: theme.formMetrics.sectionGap,
    paddingTop: theme.formMetrics.sectionGap,
    borderTopWidth: theme.strokeWidths.standard,
    borderTopColor: theme.colors.border.subtle,
  },
  fieldRow: { minWidth: 0, flexDirection: { compact: 'column', medium: 'row' }, alignItems: 'stretch', gap: theme.spacing.lg },
  fieldCell: { minWidth: 0, flex: 1 },
  actions: { minWidth: 0, flexDirection: { compact: 'column-reverse', medium: 'row' }, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: { compact: 'stretch', medium: 'center' }, gap: theme.spacing.sm, paddingTop: theme.spacing.sm },
}));
