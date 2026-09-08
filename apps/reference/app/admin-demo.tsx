import { Button, Card, ScrollScreen, Text, VStack } from '@precision-calm/ui';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
export default function CapabilityProtectedDemoScreen() { const router=usePrecisionRouter(); return <ScrollScreen><Card><VStack gap="lg"><Text variant="h2">Capability-protected route</Text><Text tone="secondary">This route exists only while the authenticated identity has settings.manage.</Text><Button label="Back" variant="secondary" onPress={() => router.backOr('/')} /></VStack></Card></ScrollScreen>; }
