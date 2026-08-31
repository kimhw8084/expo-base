import { useState } from 'react';
import { usePrecisionAuth, usePrecisionServices } from '@precision-calm/runtime';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { Badge, Button, Card, KeyValueList, Page, PageHeader, ScrollScreen, Section, Text, VStack } from '@precision-calm/ui';

export default function ServicesReferenceScreen() {
  const router = usePrecisionRouter();
  const services = usePrecisionServices();
  const auth = usePrecisionAuth();
  const [status, setStatus] = useState('Adapters ready');

  async function signOut() {
    await services.analytics.identify(null);
    await services.analytics.track({ name: 'reference_sign_out' });
    setStatus('Auth runtime requested sign out');
    await auth.signOut();
  }

  async function verifyStorage() {
    const userId = auth.session?.user.id ?? 'no-user';
    await services.storage.set('reference:last-user', userId);
    const stored = await services.storage.get('reference:last-user');
    setStatus(stored ? `Storage returned ${stored}` : 'No stored user yet');
  }

  return (
    <ScrollScreen>
      <Page
        width="content"
        header={<PageHeader eyebrow="GATE 35 / SERVICES" title="Service + auth runtime acceptance surface" description="Feature code consumes portable service contracts and centralized auth state. Backend adapters remain hidden behind runtime boundaries." actions={<Button label="Back" variant="secondary" iconStart="arrowLeft" onPress={router.back} />} />}
      >
        <Section>
          <Card>
            <VStack gap="lg">
              <Badge label={auth.status === 'signed-in' ? 'Authenticated' : auth.status} tone={auth.status === 'signed-in' ? 'positive' : 'neutral'} />
              <Text variant="h2">{auth.session?.user.displayName ?? 'Demo service boundary'}</Text>
              <Text tone="secondary">{status}</Text>
              <KeyValueList items={[
                { label: 'Auth runtime', value: auth.session?.user.email ?? auth.status },
                { label: 'Image provider', value: services.images.resolve({ source: 'reference://asset', width: 320 }) },
                { label: 'Storage', value: 'Injected KeyValueStorageAdapter' },
                { label: 'Analytics', value: 'Injected AnalyticsAdapter' },
              ]} />
              <Button label="Sign out through auth runtime" onPress={() => { void signOut(); }} />
              <Button label="Verify storage adapter" variant="secondary" onPress={() => { void verifyStorage(); }} />
            </VStack>
          </Card>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
