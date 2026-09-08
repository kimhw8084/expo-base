import { useMemo, useState } from 'react';
import {
  AdaptiveGrid,
  AdaptiveGridItem,
  AreaChart,
  AvatarGroup,
  Button,
  Card,
  CodeBlock,
  DateField,
  DateRangeField,
  Divider,
  HStack,
  Page,
  PageHeader,
  ScrollScreen,
  Section,
  SectionHeader,
  Sparkline,
  StackedBarChart,
  StatusIndicator,
  Text,
  TimeField,
  Timeline,
  VStack,
  serializeDelimitedData,
} from '@precision-calm/ui';
import { CopyableCode, CopyableValue } from '@precision-calm/sharing/ui';
import { Heatmap, Histogram, ScatterPlot } from '@precision-calm/visualization-advanced';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { useReferenceCopy } from '../ReferenceCopy';

const activity = [
  { id: 'approved', title: 'Workspace approved', timestamp: 'Today, 09:30', description: 'The review completed with no outstanding exceptions.', tone: 'positive', statusLabel: 'Complete' },
  { id: 'reviewed', title: 'Configuration reviewed', timestamp: 'Yesterday, 16:10', description: 'Two maintainers reviewed the proposed runtime policy.', tone: 'info', statusLabel: 'Reviewed' },
  { id: 'created', title: 'Workspace created', timestamp: 'Sep 2, 11:45', description: 'Initial settings were created from the Golden workflow.', tone: 'neutral' },
] as const;

const trend = [
  { label: 'Jan', value: 42 }, { label: 'Feb', value: 46 }, { label: 'Mar', value: 45 },
  { label: 'Apr', value: 53 }, { label: 'May', value: 57 }, { label: 'Jun', value: 64 },
];

const composition = [
  { label: 'Q1', values: { active: 38, pending: 12, blocked: 4 } },
  { label: 'Q2', values: { active: 45, pending: 9, blocked: 3 } },
  { label: 'Q3', values: { active: 51, pending: 10, blocked: 3 } },
];

const relationship = [
  { id: 'north', x: 12, y: 18, label: 'North' },
  { id: 'south', x: 24, y: 31, label: 'South' },
  { id: 'east', x: 36, y: 28, label: 'East' },
  { id: 'west', x: 48, y: 46, label: 'West' },
  { id: 'central', x: 62, y: 58, label: 'Central' },
  { id: 'coastal', x: 78, y: 69, label: 'Coastal' },
] as const;

const distribution = [18, 22, 24, 27, 31, 32, 35, 36, 39, 42, 44, 48, 51, 55, 62, 68, 73, 81];

const cohortCells = [
  { row: 'New', column: 'Week 1', value: 0.92 }, { row: 'New', column: 'Week 2', value: 0.68 }, { row: 'New', column: 'Week 3', value: 0.54 }, { row: 'New', column: 'Week 4', value: 0.42 },
  { row: 'Returning', column: 'Week 1', value: 0.96 }, { row: 'Returning', column: 'Week 2', value: 0.81 }, { row: 'Returning', column: 'Week 3', value: 0.72 }, { row: 'Returning', column: 'Week 4', value: 0.61 },
  { row: 'Team', column: 'Week 1', value: 0.88 }, { row: 'Team', column: 'Week 2', value: 0.77 }, { row: 'Team', column: 'Week 3', value: 0.67 }, { row: 'Team', column: 'Week 4', value: 0.58 },
] as const;

export default function GoldenPlusReferenceScreen() {
  const router = usePrecisionRouter();
  const copy = useReferenceCopy();
  const [date, setDate] = useState('2026-09-07');
  const [time, setTime] = useState('14:30');
  const [range, setRange] = useState({ start: '2026-09-07', end: '2026-09-14' });
  const exportValue = useMemo(() => serializeDelimitedData(composition, [
    { key: 'quarter', label: 'Quarter', value: (row) => row.label },
    { key: 'active', label: 'Active', value: (row) => row.values.active },
    { key: 'pending', label: 'Pending', value: (row) => row.values.pending },
    { key: 'blocked', label: 'Blocked', value: (row) => row.values.blocked },
  ]), []);

  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow={copy('GOLDEN PLUS')} title={copy('Abundant reusable depth')} description={copy('A deterministic living specification for secondary UI families that should never be rebuilt in product routes.')} actions={<HStack gap="sm"><Text variant="caption" tone="secondary">{copy('No external runtime dependency')}</Text></HStack>} />}
      >
        <Section>
          <SectionHeader title={copy('Identity and status')} description={copy('Image fallback, overlap, aggregate naming, and non-color status semantics remain centrally owned.')} />
          <AdaptiveGrid>
            <AdaptiveGridItem><Card><VStack gap="lg"><AvatarGroup label={copy('Workspace maintainers: Alex Kim, Morgan Lee, Sam Patel, and two more')} maxVisible={3} items={[{ id: 'alex', name: 'Alex Kim' }, { id: 'morgan', name: 'Morgan Lee' }, { id: 'sam', name: 'Sam Patel' }, { id: 'jordan', name: 'Jordan Rivera' }, { id: 'casey', name: 'Casey Chen' }]} /><Divider inset="start" /><StatusIndicator label={copy('Service healthy')} description={copy('All scheduled checks completed.')} tone="positive" /><StatusIndicator label={copy('Review required')} description={copy('One policy needs an owner.')} tone="warning" /></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="lg"><CopyableValue label={copy('Workspace identifier')} value="workspace_01J8QZ6VBH79M5X2" testID="golden-plus-copy-value" /><CopyableValue label={copy('Sensitive reference')} value="secret_reference_9831" sensitive /><CodeBlock label={copy('Configuration example')} value={'{\n  "density": "compact",\n  "locale": "en-US"\n}'} wrap testID="golden-plus-code" /></VStack></Card></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <SectionHeader title={copy('Chronological activity')} description={copy('Timeline owns event anatomy and responsive rails without replacing feed or domain event models.')} />
          <Card><Timeline label="Workspace history" items={activity} testID="golden-plus-timeline" /></Card>
        </Section>

        <Section>
          <SectionHeader title={copy('Portable date and time')} description={copy('Calendar dates and wall-clock times use explicit transport shapes. Native picker presentation remains an optional adapter boundary.')} />
          <Card>
            <AdaptiveGrid>
              <AdaptiveGridItem><DateField id="plus-date" label={copy('Effective date')} value={date} onChangeText={setDate} min="2026-01-01" max="2027-12-31" /></AdaptiveGridItem>
              <AdaptiveGridItem><TimeField id="plus-time" label={copy('Review time')} value={time} onChangeText={setTime} /></AdaptiveGridItem>
              <AdaptiveGridItem span="wide"><DateRangeField id="plus-range" label={copy('Reporting period')} start={range.start} end={range.end} onChange={setRange} min="2026-01-01" max="2027-12-31" /></AdaptiveGridItem>
            </AdaptiveGrid>
          </Card>
        </Section>

        <Section>
          <SectionHeader title={copy('Visualization Plus')} description={copy('Area and stacked composition share the semantic chart frame, bounded palette, responsive sizing, and visible data fallback.')} />
          <AdaptiveGrid>
            <AdaptiveGridItem><Card><VStack gap="lg"><Text variant="h3">{copy('Adoption trend')}</Text><AreaChart data={trend} name={copy('Workspace adoption')} showDataTable /><Sparkline data={trend} name={copy('Compact adoption trend')} /></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="lg"><Text variant="h3">{copy('Quarterly composition')}</Text><StackedBarChart data={composition} series={[{ key: 'active', label: copy('Active'), series: 'series1' }, { key: 'pending', label: copy('Pending'), series: 'series4' }, { key: 'blocked', label: copy('Blocked'), series: 'series5' }]} name={copy('Quarterly workspace status')} /></VStack></Card></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <SectionHeader title={copy('Advanced analytical module')} description={copy('Exploratory relationship, distribution, and matrix views stay in an opt-in module while reusing the core frame and accessible data fallback.')} />
          <AdaptiveGrid>
            <AdaptiveGridItem><Card testID="golden-plus-advanced-visualization"><VStack gap="lg"><Text variant="h3">{copy('Relationship view')}</Text><ScatterPlot data={relationship} name={copy('Regional relationship')} onSelect={() => {}} /><Text variant="caption" tone="secondary">{copy('Tap or focus a mark to inspect a named observation.')}</Text></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="lg"><Text variant="h3">{copy('Distribution')}</Text><Histogram data={distribution} name={copy('Observed distribution')} bins={6} /><Text variant="caption" tone="secondary">{copy('Bins preserve the shape of the sample without introducing a heavyweight chart engine.')}</Text></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem span="wide"><Card><VStack gap="lg"><Text variant="h3">{copy('Retention matrix')}</Text><Heatmap data={cohortCells.map((cell) => ({ ...cell, row: copy(cell.row), column: copy(cell.column) }))} name={copy('Cohort retention')} onSelect={() => {}} /><Text variant="caption" tone="secondary">{copy('A bounded matrix keeps labels and a readable data fallback together on compact layouts.')}</Text></VStack></Card></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <SectionHeader title={copy('Export and explanatory-help boundary')} description={copy('Serialization is generic; product authorization and file delivery remain explicit. Critical help uses visible disclosure or inline text, not hover-only Tooltip content.')} />
          <Card><VStack gap="lg"><CopyableCode label={copy('CSV export preview')} value={exportValue} /><Text tone="secondary">{copy('Use the optional sharing owner to copy or deliver this serialization. Products still choose who may export and where a file goes.')}</Text></VStack></Card>
        </Section>

        <Section><Card variant="subtle"><VStack gap="md"><Text variant="h3">{copy('Manual composition remains supported')}</Text><Text tone="secondary">{copy('Golden Plus adds stable mechanics, not another page architecture. Existing Golden patterns compose these owners as domain needs require.')}</Text><Button label={copy('Return to System lab')} variant="ghost" onPress={() => router.push('/system')} /></VStack></Card></Section>
      </Page>
    </ScrollScreen>
  );
}
