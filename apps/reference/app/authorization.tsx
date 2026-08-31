import { Badge, Button, Card, KeyValueList, ScrollScreen, StateView, Text, VStack } from '@precision-calm/ui';
import { CapabilityGate, usePrecisionAuthorization, usePrecisionAuthorizationRequirement } from '@precision-calm/runtime';
import { usePrecisionRouter } from '@precision-calm/navigation-router';

export default function AuthorizationAcceptanceScreen() {
  const authorization = usePrecisionAuthorization();
  const router = usePrecisionRouter();
  const reports = usePrecisionAuthorizationRequirement({ all: ['reports.view'] });
  const billing = usePrecisionAuthorizationRequirement({ all: ['billing.manage'] });
  return <ScrollScreen><Card><VStack gap="lg">
    <Text variant="h2">Authorization capability acceptance</Text>
    <Text tone="secondary">Authenticated identity and product capability are separate. Loading/error states fail closed and backend APIs must still enforce authorization.</Text>
    <Badge label={authorization.status} tone={authorization.status === 'ready' ? 'positive' : 'neutral'} />
    <KeyValueList items={[
      { label: 'Capabilities', value: authorization.capabilities.join(', ') || 'None' },
      { label: 'reports.view', value: reports.allowed ? 'Granted' : reports.reason },
      { label: 'billing.manage', value: billing.allowed ? 'Granted' : billing.reason },
    ]} />
    <CapabilityGate requirement={{ all: ['reports.view'] }} fallback={<StateView kind="permission" title="Reports unavailable" message="This identity does not have reports.view." />}><Text>Reports capability content is visible.</Text></CapabilityGate>
    <Button label="Open capability-protected route" onPress={() => router.push('/admin-demo')} />
    <Button label="Refresh capabilities" variant="secondary" onPress={() => { void authorization.refresh(); }} />
  </VStack></Card></ScrollScreen>;
}
