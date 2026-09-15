import { useState } from 'react';
import { Button, Card, ScrollScreen, Text, VStack } from '@expo-base/ui';
import { useExpoBaseAuth, useExpoBaseSessionSecurity } from '@expo-base/runtime';
import { useExpoBaseRouter } from '@expo-base/navigation-router';

export default function UnlockScreen() {
  const sessionSecurity = useExpoBaseSessionSecurity();
  const auth = useExpoBaseAuth();
  const router = useExpoBaseRouter();
  const [result, setResult] = useState<'idle' | 'denied' | 'error'>('idle');
  const unlock = async () => {
    const next = await sessionSecurity.requestUnlock();
    if (next === 'unlocked') {
      setResult('idle');
      router.replaceResolvedPath(auth.consumeReturnIntent('/'));
      return;
    }
    setResult(next);
  };
  return (
    <ScrollScreen>
      <Card>
        <VStack gap="lg">
          <Text variant="h2">Unlock session</Text>
          <Text tone="secondary">Your account remains signed in, but protected content is hidden until the local session-security adapter approves access.</Text>
          {sessionSecurity.status === 'error' || result === 'error' ? <Text tone="negative">Session security could not be verified. Protected content remains locked.</Text> : null}
          {result === 'denied' ? <Text tone="negative">Unlock was not approved. Try again when you are ready.</Text> : null}
          <Button label="Unlock" loading={sessionSecurity.status === 'loading'} onPress={() => { void unlock(); }} />
        </VStack>
      </Card>
    </ScrollScreen>
  );
}
