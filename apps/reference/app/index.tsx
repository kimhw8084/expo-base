import { Alert } from 'react-native';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import {
  AdaptiveGrid,
  AdaptiveGridItem,
  AdaptiveSplit,
  MasterDetail,
  Page,
  PageHeader,
  ResponsiveSlot,
  ScrollScreen,
  Section,
  SectionHeader,
} from '@precision-calm/ui';
import { Badge, Button, Card, ListRow, Metric, MetricGroup } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { ReferenceRuntimeControls } from '../ReferenceRuntimeControls';
import { useReferenceCopy } from '../ReferenceCopy';

const routeGroups = [
  {
    title: 'Interaction systems',
    routes: [
      { title: 'Forms', subtitle: 'Validation, keyboard ownership, selection controls', icon: 'edit', path: '/forms' },
      { title: 'Navigation', subtitle: 'Tabs, breadcrumbs, adaptive destinations', icon: 'menu', path: '/navigation' },
      { title: 'Overlays', subtitle: 'Popover, dialog, sheet, toast lifecycle', icon: 'more', path: '/overlays' },
      { title: 'Lists', subtitle: 'Virtualization and scroll ownership', icon: 'receipt', path: '/lists' },
    ],
  },
  {
    title: 'Data and feedback',
    routes: [
      { title: 'Data display', subtitle: 'Adaptive tables, metrics and pagination', icon: 'arrowUpDown', path: '/data' },
      { title: 'Visualization', subtitle: 'Charts, progress and interaction hit targets', icon: 'sparkles', path: '/visualization' },
      { title: 'Feedback', subtitle: 'Loading, empty, offline and degraded states', icon: 'info', path: '/feedback' },
      { title: 'Server state', subtitle: 'Scoped queries, stale refresh and optimistic mutations', icon: 'refresh', path: '/server-state' },
      { title: 'Accessibility & motion', subtitle: 'Live regions, focus and reduced motion', icon: 'shieldCheck', path: '/accessibility-motion' },
    ],
  },
  {
    title: 'Reference and runtime',
    routes: [
      { title: 'Golden patterns', subtitle: 'Production page-composition templates', icon: 'star', path: '/golden' },
      { title: 'Workflow lab', subtitle: 'Command, offline, completion and permission patterns', icon: 'command', path: '/workflows' },
      { title: 'System lab', subtitle: 'Complete component acceptance surface', icon: 'command', path: '/system' },
      { title: 'Golden Plus breadth', subtitle: 'Identity, utility, timeline, date/time and chart depth', icon: 'sparkles', path: '/golden-plus' },
      { title: 'Stress matrix', subtitle: 'Long text and pathological-content testing', icon: 'warning', path: '/stress' },
      { title: 'Services', subtitle: 'Backend-neutral adapter acceptance', icon: 'settings', path: '/services' },
      { title: 'Capability lab', subtitle: 'Optional runtime boundaries with deterministic fakes', icon: 'phone', path: '/capabilities' },
      { title: 'Authentication', subtitle: 'Session resolution and protected routes', icon: 'lock', path: '/auth-session' },
      { title: 'Authorization', subtitle: 'Capability and entitlement gating', icon: 'shieldCheck', path: '/authorization' },
    ],
  },
  {
    title: 'Flagship compositions',
    routes: [
      { title: 'Analytics showcase', subtitle: 'A coherent trend, comparison, distribution and detail narrative', icon: 'sparkles', path: '/analytics-showcase' },
      { title: 'Finance showcase', subtitle: 'Neutral value, contribution and target mechanics', icon: 'arrowUpDown', path: '/finance-showcase' },
      { title: 'Monitoring showcase', subtitle: 'Health, thresholds, events and operational detail', icon: 'refresh', path: '/monitoring-showcase' },
    ],
  },
] as const;

export default function FoundationReferenceScreen() {
  const router = usePrecisionRouter();
  const copy = useReferenceCopy();
  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={(
          <PageHeader
            eyebrow={copy('EXPO BASE')}
            title={copy('Universal application foundation')}
            description={copy('A production-oriented Expo reference app proving adaptive composition, semantic geometry, portable services, and consistent interaction behavior across compact through wide layouts.')}
            metadata={(
              <HStack gap="sm">
                <Badge label={copy('Adaptive')} tone="positive" />
                <Badge label={copy('Portable')} tone="info" />
              </HStack>
            )}
            actions={(
              <HStack gap="sm" justify="end">
                <Button label={copy('System lab')} variant="secondary" iconStart="command" onPress={() => router.push('/system')} responsiveWidth="compact-full" />
                <Button label={copy('Stress test')} variant="outline" iconStart="warning" onPress={() => router.push('/stress')} responsiveWidth="compact-full" />
              </HStack>
            )}
          />
        )}
      >
        <Section>
          <SectionHeader
            title={copy('Adaptive foundation')}
            description={copy('One hierarchy spans compact through wide layouts while surfaces express primary, supporting, and contextual information without feature-owned geometry.')}
            testID="home-adaptive-section-header"
            accessory={(
              <HStack gap="sm">
                <ResponsiveSlot until="medium"><Badge  testID="responsive-regime-compact" label="Compact" tone="info" /></ResponsiveSlot>
                <ResponsiveSlot from="medium" until="expanded"><Badge label="Medium" tone="info" /></ResponsiveSlot>
                <ResponsiveSlot from="expanded" until="wide"><Badge label="Expanded" tone="positive" /></ResponsiveSlot>
                <ResponsiveSlot from="wide"><Badge label="Wide" tone="positive" /></ResponsiveSlot>
              </HStack>
            )}
          />

          <MetricGroup accessibilityLabel="Foundation metrics" testID="home-metric-group">
            <Metric label="Adaptive regimes" value="4" trend="Compact · medium · expanded · wide" trendTone="positive" />
            <Metric label="Target platforms" value="3" trend="iOS · Android · web" />
            <Metric label="Minimum interaction target" value="44+" trend="Shared control and hit-area ownership" />
          </MetricGroup>

          <AdaptiveGrid>
            <AdaptiveGridItem>
              <Card variant="elevated"><VStack gap="lg"><Text variant="h3">{copy('Interaction hierarchy')}</Text><Text tone="secondary">{copy('Primary, secondary, and outline actions preserve visual priority while responsive width belongs to the component contract.')}</Text><HStack gap="sm"><Button label={copy('Primary')} responsiveWidth="compact-full" onPress={() => Alert.alert(copy('Primary action'))} /><Button label={copy('Secondary')} variant="secondary" responsiveWidth="compact-full" onPress={() => Alert.alert(copy('Secondary action'))} /><Button label={copy('Outline')} variant="outline" responsiveWidth="compact-full" onPress={() => Alert.alert(copy('Outline action'))} /></HStack></VStack></Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem>
              <Card variant="subtle"><VStack gap="lg"><Text variant="h3">{copy('Semantic status')}</Text><Text tone="secondary">{copy('Feedback colors remain semantic and theme-safe rather than feature-owned.')}</Text><HStack gap="sm"><Badge label={copy('Approved')} tone="positive" /><Badge label={copy('Review')} tone="warning" /><Badge label={copy('Blocked')} tone="negative" /><Badge label={copy('Info')} tone="info" /></HStack></VStack></Card>
            </AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <ReferenceRuntimeControls />
        </Section>

        <Section>
          <SectionHeader title="Adaptive split" description="Primary work and contextual information recompose without losing visual priority." />
          <AdaptiveSplit
            primary={<Card variant="elevated"><VStack gap="md"><Text variant="h3">Primary workspace</Text><Text tone="secondary">Compact layouts stack safely. Expanded layouts become a flexible primary pane with a controlled contextual pane.</Text><Text>This deliberately long sentence verifies wrapping without feature-owned widths, truncation hacks, or viewport checks.</Text></VStack></Card>}
            secondary={<Card variant="subtle"><VStack gap="md"><Text variant="micro" tone="secondary">CONTEXT</Text><Text variant="h3">Inspector</Text><Text tone="secondary">Width is owned by the layout contract rather than hardcoded in the product screen.</Text></VStack></Card>}
          />
        </Section>

        <Section>
          <SectionHeader title="Master / detail transformation" description="Selection context remains obvious when panes collapse from concurrent desktop views into compact workflows." />
          <MasterDetail
            master={(
              <Card>
                <VStack gap="xs">
                  <ListRow title="Venture X" subtitle="Capital One · Travel rewards" leadingIcon="creditCard" selected divider={false} onPress={() => Alert.alert('Venture X')} />
                  <ListRow title="Gold Card with a deliberately longer product name" subtitle="American Express · Premium rewards" leadingIcon="creditCard" divider={false} onPress={() => Alert.alert('Gold Card')} />
                  <ListRow title="Sapphire Preferred" subtitle="Chase · Travel" leadingIcon="creditCard" divider={false} onPress={() => Alert.alert('Sapphire Preferred')} />
                </VStack>
              </Card>
            )}
            detail={(
              <Card>
                <VStack gap="lg">
                  <HStack justify="between"><VStack gap="xs"><Text variant="micro" tone="secondary">SELECTED ITEM</Text><Text variant="h2">Venture X</Text></VStack><Badge label="Active" tone="positive" /></HStack>
                  <Text tone="secondary">Expanded layouts show master and detail concurrently. Compact layouts show one primary workflow surface instead of squeezing two panes side-by-side.</Text>
                  <Button label="Open detail workflow" onPress={() => Alert.alert('Detail workflow')} />
                </VStack>
              </Card>
            )}
          />
        </Section>

        <Section>
          <SectionHeader title={copy('Explore Expo Base')} description={copy('Each surface is a live acceptance route built from the same public primitives intended for generated applications.')} />
          <AdaptiveGrid>
            {routeGroups.map((group) => (
              <AdaptiveGridItem key={group.title}>
                <Card>
                  <VStack gap="md">
                <Text variant="h3">{copy(group.title)}</Text>
                    <VStack gap="xs">
                      {group.routes.map((route) => (
                        <ListRow
                          key={route.path}
                          title={copy(route.title)}
                          subtitle={copy(route.subtitle)}
                          leadingIcon={route.icon}
                          onPress={() => router.push(route.path as never)}
                        />
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              </AdaptiveGridItem>
            ))}
          </AdaptiveGrid>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
