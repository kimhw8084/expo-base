import { useState } from 'react';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { Page, PageHeader, ScrollScreen, Section, AdaptiveGrid, AdaptiveGridItem } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Button, Card } from '@precision-calm/ui';
import { AccessibleGroup, LiveRegion, VisuallyHidden } from '@precision-calm/ui';
import { Reveal, usePrecisionReducedMotion } from '@precision-calm/ui';
import { usePrecisionHaptics } from '@precision-calm/haptics';

export default function AccessibilityMotionReferenceScreen() {
  const router = usePrecisionRouter();
  const reduceMotion = usePrecisionReducedMotion();
  const haptics = usePrecisionHaptics();
  const [visible, setVisible] = useState(true);
  const [announcement, setAnnouncement] = useState('Ready');
  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow="GATE 12 / MOTION + ACCESSIBILITY" title="Motion is optional; meaning is not" description="Animation and haptics are progressive enhancement. Reduced-motion policy, live announcements, semantic grouping, and screen-reader-only content are centralized so interaction remains understandable without movement or vibration." />}
      >
        <Section>
          <AdaptiveGrid>
            <AdaptiveGridItem>
              <Card><VStack gap="lg"><Text variant="h2">Reduced motion</Text><Text tone="secondary">System preference detected: {reduceMotion ? 'Reduced motion enabled' : 'Standard motion enabled'}.</Text><Button label={visible ? 'Hide reveal' : 'Show reveal'} onPress={() => setVisible((value) => !value)} />{visible ? <Reveal kind="slide"><Card><VStack gap="sm"><Text variant="h3">Purposeful transition</Text><Text tone="secondary">With reduced motion enabled, Reanimated reaches the same final state without requiring the movement.</Text></VStack></Card></Reveal> : null}</VStack></Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem>
              <Card><VStack gap="lg"><Text variant="h2">Haptic intent</Text><Text tone="secondary">This lab uses a deterministic fake adapter. Production haptics are optional and silently degrade when hardware/browser support is unavailable.</Text><HStack gap="sm"><Button label="Selection" variant="secondary" onPress={() => void haptics.perform('selection')} /><Button label="Confirm" onPress={() => void haptics.perform('confirm')} /><Button label="Warning" variant="outline" onPress={() => void haptics.perform('warning')} /></HStack></VStack></Card>
            </AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h2">Live announcement</Text>
              <Text tone="secondary">Dynamic status changes use the shared live-region path instead of feature code calling native accessibility APIs.</Text>
              <HStack gap="sm"><Button label="Announce saved" onPress={() => setAnnouncement('Changes saved successfully')} /><Button label="Announce warning" variant="secondary" onPress={() => setAnnouncement('Connection quality is degraded')} /></HStack>
              <LiveRegion message={announcement} />
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h2">Semantic grouping</Text>
              <AccessibleGroup label="Travel rewards summary. Eight thousand four hundred twenty dollars in tracked value." hint="Contains a synthetic reference value for accessibility testing.">
                <VStack gap="xs"><Text variant="micro" tone="secondary">TRAVEL REWARDS</Text><Text variant="display" numeric>$8,420</Text></VStack>
              </AccessibleGroup>
              <VisuallyHidden><Text>Additional screen-reader context: values on this page are synthetic and used only for template verification.</Text></VisuallyHidden>
            </VStack>
          </Card>
        </Section>

        <Section><HStack gap="sm"><Button label="Back to feedback" variant="secondary" iconStart="arrowLeft" onPress={() => router.replace('/feedback')} /><Button label="Return to foundations" iconEnd="arrowRight" onPress={() => router.replace('/')} /></HStack></Section>
      </Page>
    </ScrollScreen>
  );
}
