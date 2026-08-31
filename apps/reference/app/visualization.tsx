import { useState } from 'react';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { formatCurrency } from '@precision-calm/platform';
import { Page, PageHeader, ScrollScreen, Section, AdaptiveGrid, AdaptiveGridItem } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { BarChart, LineChart, ProgressBar, ProgressRing, Sparkline, type ChartDatum } from '@precision-calm/ui';

const valueTrend: ChartDatum[] = [
  { label: 'Jan', value: 6200 }, { label: 'Feb', value: 6480 }, { label: 'Mar', value: 6310 }, { label: 'Apr', value: 6840 },
  { label: 'May', value: 7010 }, { label: 'Jun', value: 7380 }, { label: 'Jul', value: 7210 }, { label: 'Aug', value: 8420 },
];
const categories: ChartDatum[] = [
  { label: 'Travel', value: 1820 }, { label: 'Dining', value: 1140 }, { label: 'Grocery', value: 760 }, { label: 'Other', value: 510 },
];

export default function VisualizationReferenceScreen() {
  const router = usePrecisionRouter();
  const [selected, setSelected] = useState<ChartDatum | undefined>();
  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow="GATE 10 / VISUALIZATION" title="Tokenized charts with bounded geometry" description="Core charts share one series palette, measured chart frame, scale/path solvers, accessible summaries, and tap selection. Product screens never calculate SVG paths or import a chart engine directly." />}
      >
        <Section>
          <AdaptiveGrid>
            <AdaptiveGridItem span="wide">
              <Card>
                <VStack gap="lg">
                  <HStack justify="between" align="center"><VStack gap="xs"><Text variant="h2">Portfolio value</Text><Text tone="secondary">Area treatment, semantic accent series, quiet grid, tap-selection zones.</Text></VStack><Badge label="Interactive" tone="positive" /></HStack>
                  <LineChart data={valueTrend} name="Portfolio value" area onSelect={(datum) => setSelected(datum)} />
                  <Text variant="caption" tone="secondary">{selected ? `${selected.label}: ${formatCurrency(selected.value)}` : 'Tap a point region to persist a selected value.'}</Text>
                </VStack>
              </Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem>
              <Card><VStack gap="lg"><Text variant="h3">Spend categories</Text><BarChart data={categories} name="Spend categories" size="compact" series="series2" onSelect={(datum) => setSelected(datum)} /></VStack></Card>
            </AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <AdaptiveGrid>
            <AdaptiveGridItem>
              <Card><VStack gap="md"><Text variant="micro" tone="secondary">SPARKLINE</Text><Text variant="h2" numeric>$8,420</Text><Sparkline data={valueTrend} name="Eight month value trend" /><Text variant="caption" tone="positive">+18.7% from January</Text></VStack></Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem>
              <Card><VStack gap="lg"><Text variant="h3">Progress primitives</Text><ProgressBar value={0.68} label="Welcome bonus spend" series="series3" /><HStack align="center" gap="lg"><ProgressRing value={0.72} label="Annual benefit utilization" series="series4" /><VStack gap="xs"><Text variant="label">Benefit utilization</Text><Text variant="caption" tone="secondary">Range semantics are announced as a progress bar, not merely painted visually.</Text></VStack></HStack></VStack></Card>
            </AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Card>
            <VStack gap="md">
              <Text variant="h2">Visualization contract</Text>
              <Text tone="secondary">Charts measure their own available width, use theme-owned series colors and dimensions, filter invalid numeric values, clamp progress, and generate a textual summary. Advanced chart engines remain possible later through adapters rather than leaking into product screens.</Text>
              <HStack gap="sm"><Button label="Back to data" variant="secondary" iconStart="arrowLeft" onPress={() => router.replace('/data')} /><Button label="Return to foundations" iconEnd="arrowRight" onPress={() => router.replace('/')} /></HStack>
            </VStack>
          </Card>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
