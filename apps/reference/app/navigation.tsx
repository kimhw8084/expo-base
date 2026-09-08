import { Alert } from 'react-native';
import { useState } from 'react';
import { Breadcrumbs, Tabs, type NavigationItem } from '@precision-calm/ui';
import { Page, PageHeader, ScrollScreen, Section } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { ReferenceBackAction } from '../ReferenceBackAction';
import { useReferenceCopy } from '../ReferenceCopy';

const destinations: readonly NavigationItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'cards', label: 'Cards', icon: 'creditCard', badge: '3' },
  { key: 'rewards', label: 'Rewards', icon: 'gift' },
  { key: 'activity', label: 'Activity', icon: 'receipt' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export default function NavigationReferenceScreen() {
  const copy = useReferenceCopy();
  const [destination, setDestination] = useState('home');
  const [tab, setTab] = useState('overview');

  return (
    <ScrollScreen>
      <Page
        width="standard"
        header={<PageHeader eyebrow={copy('GATE 06 / NAVIGATION')} title={copy('Navigation acceptance surface')} description={copy('The visual navigation system is route-library agnostic. Expo Router integration is isolated behind @precision-calm/navigation-router.')} actions={<ReferenceBackAction />} />}
      >
        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">{copy('Primary destination model')}</Text>
              <Text tone="secondary">{copy('Compact layouts use a maximum of five core destinations. Expanded layouts promote the same information architecture into a persistent sidebar instead of inventing a separate route model.')}</Text>
              <HStack gap="sm">{destinations.map((item) => <Button key={item.key} label={copy(item.label)} variant={item.key === destination ? 'primary' : 'secondary'} iconStart={item.icon} onPress={() => setDestination(item.key)} />)}</HStack>
              <Badge label={`${copy('Selected')}: ${copy(destination)}`} tone="info" />
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">{copy('Tabs')}</Text>
              <Tabs activeKey={tab} onChange={setTab} items={[{ key: 'overview', label: copy('Overview') }, { key: 'rewards', label: copy('Rewards') }, { key: 'activity', label: copy('Activity') }, { key: 'benefits', label: copy('Benefits with a deliberately long label') }]} />
              <Text tone="secondary">{copy('Selected tab')}: {copy(tab)}. {copy('The tab row owns its horizontal overflow internally rather than creating page-level horizontal scrolling.')}</Text>
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">{copy('Breadcrumb hierarchy')}</Text>
              <Breadcrumbs items={[{ key: 'cards', label: copy('Cards'), onPress: () => Alert.alert(copy('Cards')) }, { key: 'personal', label: copy('Personal'), onPress: () => Alert.alert(copy('Personal')) }, { key: 'venture-x', label: 'Venture X' }]} />
              <Text tone="secondary">{copy('Breadcrumbs remain wrapping and non-destructive at narrow widths.')}</Text>
            </VStack>
          </Card>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
