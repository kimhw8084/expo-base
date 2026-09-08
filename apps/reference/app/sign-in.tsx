import { useState } from 'react';
import { Button, Card, ScrollScreen, Text, TextField, VStack } from '@precision-calm/ui';
import { usePrecisionAuth } from '@precision-calm/runtime';
import { usePrecisionRouter } from '@precision-calm/navigation-router';

export default function SignInScreen() {
  const auth = usePrecisionAuth();
  const router = usePrecisionRouter();
  const [email, setEmail] = useState('reference@example.com');
  const [password, setPassword] = useState('demo');
  const submit = async () => {
    if (await auth.signIn({ email, password })) router.replaceResolvedPath(auth.consumeReturnIntent('/'));
  };
  return (
    <ScrollScreen>
      <Card>
        <VStack gap="lg">
          <Text variant="h2">Sign in</Text>
          <Text tone="secondary">Protected routes remain unavailable until the session adapter confirms authentication.</Text>
          <TextField id="sign-in-email" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" />
          <TextField id="sign-in-password" label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
          {auth.errorCode === 'sign_in_failed' ? <Text tone="negative">Sign-in could not be completed. Check your details and try again.</Text> : null}
          <Button label="Sign in" loading={auth.actionStatus === 'signing-in'} onPress={() => { void submit(); }} />
        </VStack>
      </Card>
    </ScrollScreen>
  );
}
