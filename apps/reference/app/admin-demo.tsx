import { Button, Card, ScrollScreen, Text, VStack } from '@expo-base/ui';
import { useExpoBaseRouter } from '@expo-base/navigation-router';
export default function CapabilityProtectedDemoScreen() { const router=useExpoBaseRouter(); return <ScrollScreen><Card><VStack gap="lg"><Text variant="h2">Capability-protected route</Text><Text tone="secondary">This route exists only while the authenticated identity has settings.manage.</Text><Button label="Back" variant="secondary" onPress={() => router.backOr('/')} /></VStack></Card></ScrollScreen>; }
