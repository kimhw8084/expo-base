import { useState } from 'react';
import { useExpoBaseRouter } from '@expo-base/navigation-router';
import { LiveRegion, Page, PageHeader, ScrollScreen, Section } from '@expo-base/ui';
import { Button, Card, HStack, Text, VStack } from '@expo-base/ui';
import { useExpoBasePreferences } from '@expo-base/preferences';
import { useExpoBaseConnectivity } from '@expo-base/runtime-capabilities';
import { useExpoBaseSecureStorage } from '@expo-base/secure-storage';
import { useExpoBaseSharing } from '@expo-base/sharing/runtime';
import { useExpoBaseLocalAuthentication } from '@expo-base/local-auth';
import { useExpoBaseNotifications } from '@expo-base/notifications';
import { useExpoBaseUpdates } from '@expo-base/updates';
import { useReferenceCopy } from '../ReferenceCopy';

export default function CapabilityLabScreen() {
  const router = useExpoBaseRouter();
  const copy = useReferenceCopy();
  const preferences = useExpoBasePreferences();
  const secrets = useExpoBaseSecureStorage();
  const connectivity = useExpoBaseConnectivity();
  const sharing = useExpoBaseSharing();
  const localAuth = useExpoBaseLocalAuthentication();
  const notifications = useExpoBaseNotifications();
  const updates = useExpoBaseUpdates();
  const [result, setResult] = useState(copy('All interactions below use deterministic memory fixtures; no hardware, credentials, or backend are involved.'));
  const run = async (label: string, operation: () => Promise<{ status: string }>) => { const outcome = await operation(); setResult(`${label}: ${outcome.status}`); };
  return <ScrollScreen><Page width="dashboard" header={<PageHeader eyebrow={copy('RUNTIME CAPABILITY LAB')} title={copy('Optional boundaries, deterministic demo')} description={copy('This reference route demonstrates selection and normalized outcomes through fake adapters only. Production apps select real Expo implementations in root composition.')} />}><Section><VStack gap="lg"><Card><VStack gap="md"><Text variant="h2">{copy('Storage and sharing')}</Text><HStack gap="sm"><Button label={copy('Save preference')} onPress={() => { void run(copy('Preference'), async () => preferences.set('lab', 'saved')); }} /><Button label={copy('Store secret')} variant="secondary" onPress={() => { void run(copy('Secret'), async () => secrets.set('lab-token', 'fake')); }} /><Button label={copy('Share value')} variant="outline" onPress={() => { void run(copy('Share'), async () => sharing.share({ url: 'https://example.com/lab' })); }} /></HStack></VStack></Card><Card><VStack gap="md"><Text variant="h2">{copy('Signals and permissions')}</Text><HStack gap="sm"><Button label={copy('Read connectivity')} onPress={() => { void connectivity.getState().then((state) => setResult(`${copy('Connectivity')}: ${state.status}`)); }} /><Button label={copy('Local unlock')} variant="secondary" onPress={() => { void run(copy('Local authentication'), async () => localAuth.authenticate({ prompt: copy('Demo unlock') })); }} /><Button label={copy('Notification token')} variant="outline" onPress={() => { void run(copy('Notification token'), async () => notifications.getToken()); }} /></HStack></VStack></Card><Card><VStack gap="md"><Text variant="h2">{copy('Release boundary')}</Text><HStack gap="sm"><Button label={copy('Check update')} onPress={() => { void updates.check().then((state) => setResult(`${copy('Update')}: ${state.status}`)); }} /><Button label={copy('Back to system')} variant="secondary" onPress={() => router.replace('/system')} /></HStack></VStack></Card><Text tone="secondary">{result}</Text><LiveRegion message={result} visuallyHidden /></VStack></Section></Page></ScrollScreen>;
}
