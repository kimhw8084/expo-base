import { Alert } from 'react-native';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import {
  AdaptiveGrid,
  AdaptiveGridItem,
  AdaptiveSplit,
  MasterDetail,
  Page,
  PageHeader,
  PriorityAction,
  PriorityActionBar,
  ResponsiveSlot,
  ScrollScreen,
  Section,
} from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';

export default function FoundationReferenceScreen() {
  const router = usePrecisionRouter();
  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={(
          <PageHeader
            eyebrow="PRECISION CALM UNIVERSAL"
            title="Adaptive layout acceptance surface"
            description="Gate 02 proves responsive composition, safe-area ownership, semantic geometry, deterministic action overflow, and compact-to-wide transformations without feature-level viewport logic."
            actions={(
              <PriorityActionBar
                overflowTriggerSize="standard"
                renderOverflow={(hiddenKeys) => (
                  <Button
                    label="More"
                    variant="secondary"
                    onPress={() => Alert.alert('Overflow actions', hiddenKeys.join(', '))}
                    accessibilityLabel={`More actions: ${hiddenKeys.join(', ')}`}
                  />
                )}
              >
                <PriorityAction actionKey="save" priority="required">
                  <Button label="Save" onPress={() => Alert.alert('Save')} />
                </PriorityAction>
                <PriorityAction actionKey="compare" priority="preferred">
                  <Button label="Compare" variant="secondary" onPress={() => Alert.alert('Compare')} />
                </PriorityAction>
                <PriorityAction actionKey="export" priority="preferred">
                  <Button label="Export" variant="outline" onPress={() => Alert.alert('Export')} />
                </PriorityAction>
                <PriorityAction actionKey="share" priority="overflow">
                  <Button label="Share" variant="ghost" onPress={() => Alert.alert('Share')} />
                </PriorityAction>
                <PriorityAction actionKey="archive" priority="overflow">
                  <Button label="Archive" variant="ghost" onPress={() => Alert.alert('Archive')} />
                </PriorityAction>
              </PriorityActionBar>
            )}
          />
        )}
      >
        <Section>
          <HStack justify="between" align="center">
            <Text variant="h2">Capability-aware composition</Text>
            <ResponsiveSlot until="medium"><Badge label="Compact" tone="info" /></ResponsiveSlot>
            <ResponsiveSlot from="medium" until="expanded"><Badge label="Medium" tone="info" /></ResponsiveSlot>
            <ResponsiveSlot from="expanded" until="wide"><Badge label="Expanded" tone="positive" /></ResponsiveSlot>
            <ResponsiveSlot from="wide"><Badge label="Wide" tone="positive" /></ResponsiveSlot>
          </HStack>

          <AdaptiveGrid>
            <AdaptiveGridItem>
              <Card>
                <VStack gap="lg">
                  <Text variant="micro" tone="secondary">NUMERIC HIERARCHY</Text>
                  <Text variant="display" numeric>$84,250.00</Text>
                  <Text tone="positive">+14.2% year to date</Text>
                </VStack>
              </Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem>
              <Card>
                <VStack gap="lg">
                  <Text variant="h3">Interaction hierarchy</Text>
                  <HStack gap="sm">
                    <Button label="Primary" onPress={() => Alert.alert('Primary action')} />
                    <Button label="Secondary" variant="secondary" onPress={() => Alert.alert('Secondary action')} />
                    <Button label="Outline" variant="outline" onPress={() => Alert.alert('Outline action')} />
                  </HStack>
                </VStack>
              </Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem>
              <Card>
                <VStack gap="lg">
                  <Text variant="h3">Semantic status</Text>
                  <HStack gap="sm">
                    <Badge label="Approved" tone="positive" />
                    <Badge label="Review" tone="warning" />
                    <Badge label="Blocked" tone="negative" />
                    <Badge label="Info" tone="info" />
                  </HStack>
                </VStack>
              </Card>
            </AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Text variant="h2">Adaptive split</Text>
          <AdaptiveSplit
            primary={(
              <Card>
                <VStack gap="md">
                  <Text variant="h3">Primary workspace</Text>
                  <Text tone="secondary">On compact layouts this content stacks safely. At expanded widths it becomes the flexible main pane while the contextual pane receives a controlled semantic width.</Text>
                  <Text>This deliberately long sentence exists to test wrapping behavior without a feature author specifying widths, truncation hacks, or viewport checks.</Text>
                </VStack>
              </Card>
            )}
            secondary={(
              <Card>
                <VStack gap="md">
                  <Text variant="micro" tone="secondary">CONTEXT</Text>
                  <Text variant="h3">Inspector</Text>
                  <Text tone="secondary">No fixed feature geometry. Width is owned by the layout token contract.</Text>
                  <Badge label="Adaptive" tone="positive" />
                </VStack>
              </Card>
            )}
          />
        </Section>

        <Section>
          <Text variant="h2">Master / detail transformation</Text>
          <MasterDetail
            compactMode="master"
            master={(
              <Card>
                <VStack gap="md">
                  <Text variant="h3">Items</Text>
                  <Button label="Venture X" variant="secondary" onPress={() => Alert.alert('Venture X')} />
                  <Button label="Gold Card with a deliberately longer product name" variant="secondary" onPress={() => Alert.alert('Gold Card')} />
                  <Button label="Sapphire Preferred" variant="secondary" onPress={() => Alert.alert('Sapphire Preferred')} />
                </VStack>
              </Card>
            )}
            detail={(
              <Card>
                <VStack gap="lg">
                  <HStack justify="between">
                    <VStack gap="xs">
                      <Text variant="micro" tone="secondary">SELECTED ITEM</Text>
                      <Text variant="h2">Venture X</Text>
                    </VStack>
                    <Badge label="Active" tone="positive" />
                  </HStack>
                  <Text tone="secondary">Expanded layouts show master and detail concurrently. Compact layouts show a single primary workflow surface instead of squeezing two panes side-by-side.</Text>
                  <Button label="Open detail workflow" onPress={() => Alert.alert('Detail workflow')} />
                </VStack>
              </Card>
            )}
          />
        </Section>

        <Section>
          <Card>
            <VStack gap="md">
              <Text variant="h2">Layout contract</Text>
              <Text tone="secondary">This reference screen contains no feature-level viewport measurement, raw ScrollView, arbitrary spacing, arbitrary radius, manual z-index, absolute page composition, or platform branching. The layout layer owns those decisions.</Text>
              <HStack gap="sm"><Button label="Verify interaction" size="lg" onPress={() => Alert.alert('Interaction contract', 'The reference action is reachable and deterministic.')} /><Button label="Open forms gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/forms')} /><Button label="Open navigation gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/navigation')} /><Button label="Open overlays gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/overlays')} /><Button label="Open lists gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/lists')} /><Button label="Open data gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/data')} /><Button label="Open visualization gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/visualization')} /><Button label="Open feedback gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/feedback')} /><Button label="Open accessibility/motion gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/accessibility-motion')} /><Button label="Open golden patterns" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/golden')} /><Button label="Open system lab" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/system')} /><Button label="Open stress matrix" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/stress')} /><Button label="Open services gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/services')} /><Button label="Open auth gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/auth-session')} /><Button label="Open authorization gate" size="lg" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/authorization')} /></HStack>
            </VStack>
          </Card>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
