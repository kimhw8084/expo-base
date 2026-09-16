import { Badge, Button, Card, KeyValueList, ScrollScreen, StateView, Text, VStack } from '@expo-base/ui';
import { CapabilityGate, useExpoBaseAuthorization, useExpoBaseAuthorizationRequirement } from '@expo-base/runtime';
import { useExpoBaseRouter } from '@expo-base/navigation-router';

export default function AuthorizationAcceptanceScreen() {
  const authorization = useExpoBaseAuthorization();
  const router = useExpoBaseRouter();
  const reports = useExpoBaseAuthorizationRequirement({ all: ['reports.view'] });
  const billing = useExpoBaseAuthorizationRequirement({ all: ['billing.manage'] });
  return <ScrollScreen><Card><VStack gap="lg">
    <Text variant="h2">Authorization capability acceptance</Text>
    <Text tone="secondary">Authenticated identity and product capability are separate. Loading/error states fail closed and backend APIs must still enforce authorization.</Text>
    <Badge label={authorization.status} tone={authorization.status === 'ready' ? 'positive' : 'neutral'} />
    <KeyValueList items={[
      { key: 'capabilities', label: 'Capabilities', value: authorization.capabilities.join(', ') || 'None' },
      { key: 'reports-view', label: 'reports.view', value: reports.allowed ? 'Granted' : reports.reason },
      { key: 'billing-manage', label: 'billing.manage', value: billing.allowed ? 'Granted' : billing.reason },
    ]} />
    <CapabilityGate requirement={{ all: ['reports.view'] }} fallback={<StateView kind="permission" title="Reports unavailable" message="This identity does not have reports.view." />}><Text>Reports capability content is visible.</Text></CapabilityGate>
    <Button label="Open capability-protected route" onPress={() => router.push('/admin-demo')} />
    <Button label="Refresh capabilities" variant="secondary" loading={authorization.status === 'loading'} onPress={() => { void authorization.refresh(); }} />
  </VStack></Card></ScrollScreen>;
}
