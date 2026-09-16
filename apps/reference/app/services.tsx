import { useState } from 'react';
import { useExpoBaseAsyncAction, useExpoBaseAuth, useExpoBaseServices } from '@expo-base/runtime';
import { Badge, Button, Card, KeyValueList, Page, PageHeader, ScrollScreen, Section, Text, VStack } from '@expo-base/ui';
import { ReferenceBackAction } from '../ReferenceBackAction';

export default function ServicesReferenceScreen() {
  const services = useExpoBaseServices();
  const auth = useExpoBaseAuth();
  const [status, setStatus] = useState('Adapters ready');

  const signOut = useExpoBaseAsyncAction(async () => {
    await services.analytics.identify(null);
    await services.analytics.track({ name: 'reference_sign_out' });
    return auth.signOut();
  });

  const verifyStorage = useExpoBaseAsyncAction(async () => {
    const userId = auth.session?.user.id ?? 'no-user';
    await services.storage.set('reference:last-user', userId);
    return services.storage.get('reference:last-user');
  });

  return (
    <ScrollScreen>
      <Page
        width="standard"
        header={<PageHeader eyebrow="GATE 35 / SERVICES" title="Service + auth runtime acceptance surface" description="Feature code consumes portable service contracts and centralized auth state. Backend adapters remain hidden behind runtime boundaries." actions={<ReferenceBackAction />} />}
      >
        <Section>
          <Card>
            <VStack gap="lg">
              <Badge label={auth.status === 'signed-in' ? 'Authenticated' : auth.status} tone={auth.status === 'signed-in' ? 'positive' : 'neutral'} />
              <Text variant="h2">{auth.session?.user.displayName ?? 'Demo service boundary'}</Text>
              <Text tone="secondary">{status}</Text>
              <KeyValueList items={[
                { key: 'auth-runtime', label: 'Auth runtime', value: auth.session?.user.email ?? auth.status },
                { key: 'image-provider', label: 'Image provider', value: services.images.resolve({ source: 'reference://asset', width: 320 }) },
                { key: 'storage', label: 'Storage', value: 'Injected KeyValueStorageAdapter' },
                { key: 'analytics', label: 'Analytics', value: 'Injected AnalyticsAdapter' },
              ]} />
              <Button label="Sign out through auth runtime" loading={signOut.state.status === 'loading'} onPress={() => { setStatus('Auth runtime requested sign out'); void signOut.run(); }} />
              <Button label="Verify storage adapter" variant="secondary" loading={verifyStorage.state.status === 'loading'} onPress={() => { void verifyStorage.run().then((stored) => { if (stored !== undefined) setStatus(stored ? `Storage returned ${stored}` : 'No stored user yet'); }); }} />
            </VStack>
          </Card>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
