import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Link } from '@expo-base/components';
import { Icon } from '@expo-base/icons';
import { Text } from '@expo-base/primitives';

export interface BreadcrumbItem { key: string; label: string; onPress?: (() => void) | undefined; }
export interface BreadcrumbsProps { items: readonly BreadcrumbItem[]; }
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <View style={styles.root} accessibilityLabel="Breadcrumbs">
      {items.map((item, index) => <View key={item.key} style={styles.item}>{index > 0 ? <Icon name="chevronRight" size="xs" tone="tertiary" /> : null}{item.onPress ? <Link label={item.label} onPress={item.onPress} /> : <Text variant="label">{item.label}</Text>}</View>)}
    </View>
  );
}
const styles = StyleSheet.create((theme) => ({ root: { minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.xs }, item: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs } }));
