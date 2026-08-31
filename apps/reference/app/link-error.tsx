import { Button, Card, ScrollScreen, Text, VStack } from '@precision-calm/ui';
import { usePrecisionRouter } from '@precision-calm/navigation-router';

export default function LinkErrorScreen() {
  const router = usePrecisionRouter();
  return (
    <ScrollScreen>
      <Card>
        <VStack gap="lg">
          <Text variant="h2">This link cannot be opened safely</Text>
          <Text tone="secondary">The destination is malformed, unsupported, or is not trusted by this application.</Text>
          <Button label="Return home" onPress={() => router.replace('/')} />
        </VStack>
      </Card>
    </ScrollScreen>
  );
}
