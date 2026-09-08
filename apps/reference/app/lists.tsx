import { useState } from 'react';
import { ListScreen, StaticList } from '@precision-calm/ui';
import { PageHeader, SectionHeader } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { ListRow } from '@precision-calm/ui';
import { SkeletonList, StateView } from '@precision-calm/ui';
import { ReferenceBackAction } from '../ReferenceBackAction';

interface ActivityRow { id: string; title: string; subtitle: string; value: string; positive?: boolean; }
type ListMode = 'data' | 'loading' | 'empty';

const rows: ActivityRow[] = Array.from({ length: 250 }, (_, index) => ({
  id: `activity-${index + 1}`,
  title: index % 3 === 0 ? 'Welcome bonus' : index % 3 === 1 ? 'Dining purchase' : 'Travel credit',
  subtitle: `Synthetic activity item ${index + 1}`,
  value: index % 3 === 1 ? `−$${(24 + index * 1.17).toFixed(2)}` : `+$${(50 + index * 2.35).toFixed(2)}`,
  positive: index % 3 !== 1,
}));

export default function ListsReferenceScreen() {
  const [mode, setMode] = useState<ListMode>('data');
  const visibleItems = mode === 'data' ? rows : [];

  return (
    <ListScreen
      items={visibleItems}
      keyExtractor={(item) => item.id}
      gap="xs"
      loading={mode === 'loading'}
      loadingComponent={<Card variant="subtle"><SkeletonList rows={6} label="Loading activity list" /></Card>}
      empty={<Card variant="subtle"><StateView kind="empty" title="No activity yet" message="New activity will appear here when transactions or rewards arrive." actionLabel="Show sample data" onAction={() => setMode('data')} /></Card>}
      header={(
        <VStack gap="xl">
          <PageHeader eyebrow="GATE 08 / LISTS" title="Virtualized list acceptance surface" description="This route renders 250 synthetic rows through one screen-owned FlatList. Product code never owns raw list virtualization or nested vertical scrolling." actions={<ReferenceBackAction />} />
          <Card variant="subtle">
            <VStack gap="md">
              <SectionHeader title="Production list states" description="Loading, empty, and live-data ownership stay inside the shared list contract." accessory={<Badge label="Stateful" tone="info" />} />
              <HStack gap="sm">
                <Button label="Live data" size="sm" variant={mode === 'data' ? 'primary' : 'secondary'} onPress={() => setMode('data')} />
                <Button label="Loading state" size="sm" variant={mode === 'loading' ? 'primary' : 'secondary'} onPress={() => setMode('loading')} />
                <Button label="Empty state" size="sm" variant={mode === 'empty' ? 'primary' : 'secondary'} onPress={() => setMode('empty')} />
              </HStack>
            </VStack>
          </Card>
          <Card padding="compact">
            <VStack gap="lg">
              <SectionHeader title="Small static groups" description="StaticList remains the bounded choice for small groups embedded inside another scroll owner." accessory={<Badge label="≤40 items" tone="info" />} />
              <Text tone="secondary">Small groups embedded inside another scroll owner use StaticList. Above the contract threshold, development warns and the screen should move to ListScreen.</Text>
              <StaticList
                items={[{ id: 'a', label: 'Profile settings' }, { id: 'b', label: 'Notification preferences' }, { id: 'c', label: 'Connected accounts' }]}
                keyExtractor={(item) => item.id}
                renderItem={(item) => <Button label={item.label} variant="secondary" responsiveWidth="compact-full" onPress={() => undefined} />}
              />
            </VStack>
          </Card>
        </VStack>
      )}
      renderItem={({ item }) => (
        <ListRow
          testID={`activity-row-${item.id}`}
          title={item.title}
          subtitle={item.subtitle}
          disclosure={false}
          trailing={<Text variant="label" numeric tone={item.positive ? 'positive' : 'primary'}>{item.value}</Text>}
        />
      )}
      onEndReached={() => undefined}
      testID="activity-list"
    />
  );
}
