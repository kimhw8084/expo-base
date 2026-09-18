import { useState } from 'react';
import { Button, Card, FormScreen, Text, TextField, VStack } from '@expo-base/ui';
import { useExpoBaseAuth } from '@expo-base/runtime';
import { useExpoBaseRouter } from '@expo-base/navigation-router';

export default function SignInScreen() {
  const auth = useExpoBaseAuth();
  const router = useExpoBaseRouter();
  const [email, setEmail] = useState('reference@example.com');
  const [password, setPassword] = useState('demo');
  const submit = async () => {
    if (await auth.signIn({ email, password })) router.replaceResolvedPath(auth.consumeReturnIntent('/'));
  };
  return (
    <FormScreen onSubmit={() => { void submit(); }}>
      <Card>
        <VStack gap="lg">
          <Text variant="h2">Sign in</Text>
          <Text tone="secondary">Protected routes remain unavailable until the session adapter confirms authentication.</Text>
          <TextField id="sign-in-email" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" />
          <TextField id="sign-in-password" label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
          {auth.errorCode === 'sign_in_failed' ? <Text tone="negative">Sign-in could not be completed. Check your details and try again.</Text> : null}
          <Button type="submit" label="Sign in" loading={auth.actionStatus === 'signing-in'} responsiveWidth="compact-full" onPress={() => { void submit(); }} />
        </VStack>
      </Card>
    </FormScreen>
  );
}
