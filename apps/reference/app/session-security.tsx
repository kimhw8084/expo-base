import { Button, Card, KeyValueList, ScrollScreen, Text, VStack } from '@precision-calm/ui';
import { usePrecisionAuthAccess, usePrecisionSessionSecurity } from '@precision-calm/runtime';

export default function SessionSecurityAcceptanceScreen() {
  const sessionSecurity = usePrecisionSessionSecurity();
  const access = usePrecisionAuthAccess();
  return (
    <ScrollScreen>
      <Card>
        <VStack gap="lg">
          <Text variant="h2">Session security acceptance</Text>
          <Text tone="secondary">Local session locking is resolved independently from backend authentication. Locking this session must immediately remove protected routes from navigation eligibility.</Text>
          <KeyValueList items={[
            { key: 'status', label: 'Security status', value: sessionSecurity.status },
            { key: 'locked', label: 'Locked', value: sessionSecurity.locked ? 'Yes' : 'No' },
            { key: 'reason', label: 'Reason', value: sessionSecurity.reason ?? 'None' },
            { key: 'access', label: 'Protected access', value: access },
          ]} />
          <Button label="Lock session" variant="outline" onPress={() => { void sessionSecurity.lock('manual'); }} />
        </VStack>
      </Card>
    </ScrollScreen>
  );
}
