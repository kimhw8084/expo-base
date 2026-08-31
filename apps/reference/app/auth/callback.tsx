import { Card, ScrollScreen, Text, VStack } from '@precision-calm/ui';

export default function AuthCallbackAcceptanceScreen() {
  return <ScrollScreen><Card><VStack gap="md"><Text variant="h2">Authentication callback</Text><Text tone="secondary">A production auth adapter consumes validated callback parameters here. Query values are never rendered or logged by this reference route.</Text></VStack></Card></ScrollScreen>;
}
