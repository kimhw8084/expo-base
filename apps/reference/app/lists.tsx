import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { ListScreen, StaticList } from '@precision-calm/ui';
import { PageHeader } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';

interface ActivityRow { id: string; title: string; subtitle: string; value: string; positive?: boolean; }
const rows: ActivityRow[] = Array.from({ length: 250 }, (_, index) => ({
  id: `activity-${index + 1}`,
  title: index % 3 === 0 ? 'Welcome bonus' : index % 3 === 1 ? 'Dining purchase' : 'Travel credit',
  subtitle: `Synthetic activity item ${index + 1}`,
  value: index % 3 === 1 ? `−$${(24 + index * 1.17).toFixed(2)}` : `+$${(50 + index * 2.35).toFixed(2)}`,
  positive: index % 3 !== 1,
}));

export default function ListsReferenceScreen() {
  const router = usePrecisionRouter();
  return (
    <ListScreen
      items={rows}
      keyExtractor={(item) => item.id}
      header={(
        <VStack gap="xl">
          <PageHeader eyebrow="GATE 08 / LISTS" title="Virtualized list acceptance surface" description="This route renders 250 synthetic rows through one screen-owned FlatList. Product code never owns raw list virtualization or nested vertical scrolling." actions={<Button label="Back" variant="secondary" iconStart="arrowLeft" onPress={router.back} />} />
          <Card>
            <VStack gap="lg">
              <HStack justify="between"><Text variant="h3">Small static groups</Text><Badge label="≤40 items" tone="info" /></HStack>
              <Text tone="secondary">Small groups embedded inside another scroll owner use StaticList. Above the contract threshold, development warns and the screen should move to ListScreen.</Text>
              <StaticList
                items={[{ id: 'a', label: 'Profile settings' }, { id: 'b', label: 'Notification preferences' }, { id: 'c', label: 'Connected accounts' }]}
                keyExtractor={(item) => item.id}
                renderItem={(item) => <Button label={item.label} variant="secondary" onPress={() => undefined} />}
              />
            </VStack>
          </Card>
        </VStack>
      )}
      renderItem={({ item }) => (
        <Card>
          <HStack justify="between" align="center">
            <VStack gap="xs"><Text variant="label">{item.title}</Text><Text variant="caption" tone="secondary">{item.subtitle}</Text></VStack>
            <Text variant="label" numeric tone={item.positive ? 'positive' : 'primary'}>{item.value}</Text>
          </HStack>
        </Card>
      )}
      onEndReached={() => undefined}
    />
  );
}
