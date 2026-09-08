import { useState } from 'react';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { formatCurrency } from '@precision-calm/platform';
import { Page, PageHeader, ScrollScreen, Section, SectionHeader, AdaptiveGrid, AdaptiveGridItem } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { BarChart, DonutChart, LineChart, ProgressBar, ProgressRing, Sparkline, type ChartDatum } from '@precision-calm/ui';
import { useReferenceCopy } from '../ReferenceCopy';

const valueTrend: ChartDatum[] = [
  { label: 'Jan', value: 6200 }, { label: 'Feb', value: 6480 }, { label: 'Mar', value: 6310 }, { label: 'Apr', value: 6840 },
  { label: 'May', value: 7010 }, { label: 'Jun', value: 7380 }, { label: 'Jul', value: 7210 }, { label: 'Aug', value: 8420 },
];
const categories: ChartDatum[] = [
  { label: 'Travel', value: 1820 }, { label: 'Dining', value: 1140 }, { label: 'Grocery', value: 760 }, { label: 'Other', value: 510 },
];

export default function VisualizationReferenceScreen() {
  const router = usePrecisionRouter();
  const copy = useReferenceCopy();
  const [selected, setSelected] = useState<ChartDatum | undefined>();
  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow={copy('GATE 10 / VISUALIZATION')} title={copy('Tokenized charts with bounded geometry')} description={copy('Core charts share one series palette, measured chart frame, scale/path solvers, accessible summaries, and tap selection. Product screens never calculate SVG paths or import a chart engine directly.')} />}
      >
        <Section>
          <AdaptiveGrid>
            <AdaptiveGridItem span="wide">
              <Card testID="visualization-portfolio-card">
                <VStack gap="lg">
                  <SectionHeader
                    testID="visualization-portfolio-header"
                    title={copy('Portfolio value')}
                    description={copy('Area treatment, semantic accent series, quiet grid, tap-selection zones.')}
                    accessory={<Badge label={copy('Interactive')} tone="positive" />}
                  />
                  <LineChart data={valueTrend} name="Portfolio value" area onSelect={(datum) => setSelected(datum)} />
                  <Text variant="caption" tone="secondary">{selected ? `${selected.label}: ${formatCurrency(selected.value)}` : 'Tap a point region to persist a selected value.'}</Text>
                </VStack>
              </Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem>
              <Card><VStack gap="lg"><Text variant="h3">{copy('Spend categories')}</Text><BarChart data={categories} name={copy('Spend categories')} size="compact" series="series2" onSelect={(datum) => setSelected(datum)} showDataTable /><DonutChart data={categories} name={copy('Spend composition')} size="compact" onSelect={(datum) => setSelected(datum)} showDataTable /></VStack></Card>
            </AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <AdaptiveGrid>
            <AdaptiveGridItem>
              <Card><VStack gap="md"><Text variant="micro" tone="secondary">SPARKLINE</Text><Text variant="h2" numeric>$8,420</Text><Sparkline data={valueTrend} name="Eight month value trend" /><Text variant="caption" tone="positive">+18.7% from January</Text></VStack></Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem>
              <Card><VStack gap="lg"><Text variant="h3">{copy('Progress primitives')}</Text><ProgressBar value={0.68} label={copy('Welcome bonus spend')} series="series3" /><HStack align="center" gap="lg"><ProgressRing value={0.72} label={copy('Annual benefit utilization')} series="series4" /><VStack gap="xs"><Text variant="label">{copy('Benefit utilization')}</Text><Text variant="caption" tone="secondary">{copy('Range semantics are announced as a progress bar, not merely painted visually.')}</Text></VStack></HStack></VStack></Card>
            </AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Card><VStack gap="lg"><Text variant="h2">{copy('Async chart states')}</Text><Text tone="secondary">{copy('ChartFrame owns loading, error, empty, accessible summary, and optional data-table anatomy. These deterministic specimens do not rely on a remote chart service.')}</Text><AdaptiveGrid><AdaptiveGridItem><LineChart data={valueTrend} name={copy('Loading trend')} state="loading" /></AdaptiveGridItem><AdaptiveGridItem><BarChart data={categories} name={copy('Unavailable categories')} state="error" errorMessage={copy('Category data could not be refreshed.')} /></AdaptiveGridItem></AdaptiveGrid></VStack></Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="md">
              <Text variant="h2">{copy('Visualization contract')}</Text>
              <Text tone="secondary">{copy('Charts measure their own available width, use theme-owned series colors and dimensions, filter invalid numeric values, clamp progress, and generate a textual summary. Advanced chart engines remain possible later through adapters rather than leaking into product screens.')}</Text>
              <HStack gap="sm"><Button label={copy('Back to data')} variant="secondary" iconStart="arrowLeft" onPress={() => router.replace('/data')} /><Button label={copy('Return to foundations')} iconEnd="arrowRight" onPress={() => router.replace('/')} /></HStack>
            </VStack>
          </Card>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
