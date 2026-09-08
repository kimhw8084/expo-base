import { useState } from 'react';
import { Button, Card, ScrollScreen, Text, VStack } from '@precision-calm/ui';
import { usePrecisionAsyncAction, usePrecisionLinking } from '@precision-calm/runtime';

export default function LinkingAcceptanceScreen() {
  const linking = usePrecisionLinking();
  const openDocs = usePrecisionAsyncAction(() => linking.openExternal('https://docs.expo.dev/linking/overview/'));
  const [status, setStatus] = useState('Not tested');
  const safe = linking.validateExternal('https://docs.expo.dev/linking/overview/');
  const hostile = linking.validateExternal('javascript:alert(1)');
  return (
    <ScrollScreen>
      <VStack gap="lg">
        <Card><VStack gap="md"><Text variant="h2">Safe linking</Text><Text tone="secondary">External destinations are policy-gated before Expo Linking is invoked.</Text><Text>Approved HTTPS: {safe.allowed ? 'allowed' : 'blocked'}</Text><Text>javascript: {hostile.allowed ? 'allowed' : `blocked (${hostile.reason})`}</Text><Button label="Open Expo linking docs" loading={openDocs.state.status === 'loading'} onPress={() => { void openDocs.run().then((result) => { if (result) setStatus(result.status); }); }} /><Text tone="secondary">Last action: {status}</Text></VStack></Card>
      </VStack>
    </ScrollScreen>
  );
}
