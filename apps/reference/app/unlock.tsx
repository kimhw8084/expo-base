import { useState } from 'react';
import { Button, Card, ScrollScreen, Text, VStack } from '@precision-calm/ui';
import { usePrecisionAuth, usePrecisionSessionSecurity } from '@precision-calm/runtime';
import { usePrecisionRouter } from '@precision-calm/navigation-router';

export default function UnlockScreen() {
  const sessionSecurity = usePrecisionSessionSecurity();
  const auth = usePrecisionAuth();
  const router = usePrecisionRouter();
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
