import { Alert } from 'react-native';
import { useState } from 'react';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { Breadcrumbs, Tabs, type NavigationItem } from '@precision-calm/ui';
import { Page, PageHeader, ScrollScreen, Section } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';

const destinations: readonly NavigationItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'cards', label: 'Cards', icon: 'creditCard', badge: '3' },
  { key: 'rewards', label: 'Rewards', icon: 'gift' },
  { key: 'activity', label: 'Activity', icon: 'receipt' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export default function NavigationReferenceScreen() {
  const router = usePrecisionRouter();
  const [destination, setDestination] = useState('home');
  const [tab, setTab] = useState('overview');

  return (
    <ScrollScreen>
      <Page
        width="standard"
        header={<PageHeader eyebrow="GATE 06 / NAVIGATION" title="Navigation acceptance surface" description="The visual navigation system is route-library agnostic. Expo Router integration is isolated behind @precision-calm/navigation-router." actions={<Button label="Back" variant="secondary" iconStart="arrowLeft" onPress={router.back} />} />}
      >
        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">Primary destination model</Text>
              <Text tone="secondary">Compact layouts use a maximum of five core destinations. Expanded layouts promote the same information architecture into a persistent sidebar instead of inventing a separate route model.</Text>
              <HStack gap="sm">{destinations.map((item) => <Button key={item.key} label={item.label} variant={item.key === destination ? 'primary' : 'secondary'} iconStart={item.icon} onPress={() => setDestination(item.key)} />)}</HStack>
              <Badge label={`Selected: ${destination}`} tone="info" />
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">Tabs</Text>
              <Tabs activeKey={tab} onChange={setTab} items={[{ key: 'overview', label: 'Overview' }, { key: 'rewards', label: 'Rewards' }, { key: 'activity', label: 'Activity' }, { key: 'benefits', label: 'Benefits with a deliberately long label' }]} />
              <Text tone="secondary">Selected tab: {tab}. The tab row owns its horizontal overflow internally rather than creating page-level horizontal scrolling.</Text>
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">Breadcrumb hierarchy</Text>
              <Breadcrumbs items={[{ key: 'cards', label: 'Cards', onPress: () => Alert.alert('Cards') }, { key: 'personal', label: 'Personal', onPress: () => Alert.alert('Personal') }, { key: 'venture-x', label: 'Venture X' }]} />
              <Text tone="secondary">Breadcrumbs remain wrapping and non-destructive at narrow widths.</Text>
            </VStack>
          </Card>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
