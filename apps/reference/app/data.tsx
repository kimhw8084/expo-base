import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { formatCurrency, formatPercent } from '@precision-calm/platform';
import { Page, PageHeader, ScrollScreen, Section } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { AdaptiveDataTable, KeyValueList, ListRow, Metric, MetricGroup, Pagination, type DataColumn } from '@precision-calm/ui';

type CardRecord = {
  id: string;
  name: string;
  issuer: string;
  annualFee: number;
  value: number;
  utilization: number;
  status: 'Active' | 'Review' | 'Closed';
};

const allRows: CardRecord[] = [
  { id: 'venture-x', name: 'Venture X', issuer: 'Capital One', annualFee: 395, value: 1220, utilization: 0.12, status: 'Active' },
  { id: 'gold', name: 'Gold Card with a deliberately long product name', issuer: 'American Express', annualFee: 325, value: 980, utilization: 0.27, status: 'Review' },
  { id: 'sapphire', name: 'Sapphire Preferred', issuer: 'Chase', annualFee: 95, value: 690, utilization: 0.08, status: 'Active' },
  { id: 'custom-cash', name: 'Custom Cash', issuer: 'Citi', annualFee: 0, value: 380, utilization: 0.03, status: 'Closed' },
  { id: 'altitude', name: 'Altitude Reserve', issuer: 'U.S. Bank', annualFee: 400, value: 840, utilization: 0.19, status: 'Active' },
  { id: 'bilt', name: 'Bilt Mastercard', issuer: 'Wells Fargo', annualFee: 0, value: 510, utilization: 0.06, status: 'Active' },
  { id: 'freedom', name: 'Freedom Flex', issuer: 'Chase', annualFee: 0, value: 320, utilization: 0.11, status: 'Review' },
];

const columns: readonly DataColumn<CardRecord>[] = [
  { key: 'name', label: 'Card', primary: true, weight: 'lg', render: (row) => row.name },
  { key: 'issuer', label: 'Issuer', weight: 'md', render: (row) => row.issuer },
  { key: 'fee', label: 'Annual fee', numeric: true, weight: 'sm', render: (row) => formatCurrency(row.annualFee) },
  { key: 'value', label: 'Reward value', numeric: true, weight: 'sm', render: (row) => formatCurrency(row.value) },
  { key: 'utilization', label: 'Utilization', numeric: true, weight: 'sm', render: (row) => formatPercent(row.utilization) },
  { key: 'status', label: 'Status', weight: 'sm', render: (row) => <Badge label={row.status} tone={row.status === 'Active' ? 'positive' : row.status === 'Review' ? 'warning' : 'neutral'} /> },
];

export default function DataDisplayReferenceScreen() {
  const router = usePrecisionRouter();
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState('venture-x');
  const pageSize = 4;
  const pageCount = Math.ceil(allRows.length / pageSize);
  const rows = useMemo(() => allRows.slice((page - 1) * pageSize, page * pageSize), [page]);
  const selected = allRows.find((row) => row.id === selectedKey) ?? allRows[0];

  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow="GATE 09 / DATA & CONTENT" title="Adaptive data without squeezed mobile tables" description="The same semantic dataset becomes a columnar view at expanded widths and structured label/value records on compact layouts. Formatting, row interaction, pagination, and status remain centralized." />}
      >
        <Section>
          <MetricGroup>
            <Metric label="Total annual fees" value={formatCurrency(allRows.reduce((sum, row) => sum + row.annualFee, 0))} trend="7 cards tracked" />
            <Metric label="Estimated reward value" value={formatCurrency(allRows.reduce((sum, row) => sum + row.value, 0))} trend="Synthetic reference data" trendTone="positive" />
            <Metric label="Average utilization" value={formatPercent(allRows.reduce((sum, row) => sum + row.utilization, 0) / allRows.length)} trend="Central numeric formatting" />
          </MetricGroup>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <HStack justify="between" align="center">
                <VStack gap="xs"><Text variant="h2">Adaptive table</Text><Text tone="secondary">Tap a row. Resize between compact and expanded layouts to verify structural transformation.</Text></VStack>
                <Badge label="Responsive" tone="positive" />
              </HStack>
              <AdaptiveDataTable rows={rows} columns={columns} keyExtractor={(row) => row.id} selectedKey={selectedKey} onRowPress={(row) => setSelectedKey(row.id)} />
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h2">Selected record</Text>
              {selected ? <KeyValueList items={[
                { key: 'card', label: 'Card', value: selected.name },
                { key: 'issuer', label: 'Issuer', value: selected.issuer },
                { key: 'fee', label: 'Annual fee', value: formatCurrency(selected.annualFee) },
                { key: 'value', label: 'Reward value', value: formatCurrency(selected.value) },
                { key: 'utilization', label: 'Utilization', value: formatPercent(selected.utilization) },
              ]} /> : null}
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="md">
              <Text variant="h2">List-row content primitive</Text>
              <ListRow title="Upcoming annual-fee review" subtitle="A dense, reusable content row retains 44px+ interaction safety and token-owned geometry." leadingIcon="clock" trailing={<Badge label="12 days" tone="warning" />} onPress={() => Alert.alert('Review opened')} />
              <ListRow title="Transfer bonus detected" subtitle="A second content pattern uses the same visual hierarchy across web and native." leadingIcon="gift" trailing={<Badge label="+20%" tone="positive" />} onPress={() => Alert.alert('Bonus opened')} />
            </VStack>
          </Card>
        </Section>

        <Section>
          <HStack gap="sm">
            <Button label="Back to foundations" variant="secondary" iconStart="arrowLeft" onPress={() => router.replace('/')} />
            <Button label="Continue to visualization" iconEnd="arrowRight" onPress={() => router.push('/visualization')} />
          </HStack>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
