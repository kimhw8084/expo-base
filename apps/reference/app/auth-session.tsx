import { Button, Card, KeyValueList, ScrollScreen, Text, VStack } from '@precision-calm/ui';
import { usePrecisionAuth, usePrecisionAuthAccess } from '@precision-calm/runtime';

export default function AuthSessionAcceptanceScreen() {
  const auth = usePrecisionAuth();
  const access = usePrecisionAuthAccess();
  return (
    <ScrollScreen>
      <Card>
        <VStack gap="lg">
          <Text variant="h2">Authentication session acceptance</Text>
          <Text tone="secondary">This route is itself protected. Signing out must remove it from navigation history and expose only signed-out routes.</Text>
          <KeyValueList items={[
            { key: 'resolution', label: 'Resolution', value: auth.status },
            { key: 'access', label: 'Access', value: access },
            { key: 'action', label: 'Action', value: auth.actionStatus },
            { key: 'user', label: 'User', value: auth.session?.user.email ?? 'None' },
          ]} />
          <Button label="Sign out and test guard" variant="outline" onPress={() => { void auth.signOut(); }} />
        </VStack>
      </Card>
    </ScrollScreen>
  );
}
