import { useState } from 'react';
import { Button, Card, ScrollScreen, Text, VStack } from '@precision-calm/ui';
import { usePrecisionLinking } from '@precision-calm/runtime';

export default function LinkingAcceptanceScreen() {
  const linking = usePrecisionLinking();
  const [status, setStatus] = useState('Not tested');
  const safe = linking.validateExternal('https://docs.expo.dev/linking/overview/');
  const hostile = linking.validateExternal('javascript:alert(1)');
  return (
    <ScrollScreen>
      <VStack gap="lg">
        <Card><VStack gap="md"><Text variant="h2">Safe linking</Text><Text tone="secondary">External destinations are policy-gated before Expo Linking is invoked.</Text><Text>Approved HTTPS: {safe.allowed ? 'allowed' : 'blocked'}</Text><Text>javascript: {hostile.allowed ? 'allowed' : `blocked (${hostile.reason})`}</Text><Button label="Open Expo linking docs" onPress={async () => { const result = await linking.openExternal('https://docs.expo.dev/linking/overview/'); setStatus(result.status); }} /><Text tone="secondary">Last action: {status}</Text></VStack></Card>
      </VStack>
    </ScrollScreen>
  );
}
