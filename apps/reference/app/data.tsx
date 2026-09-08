import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { formatCurrency, formatPercent } from '@precision-calm/platform';
import { Page, PageHeader, ScrollScreen, Section, SectionHeader } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { AdaptiveDataTable, CheckboxGroup, CursorPagination, DataToolbar, FilterDrawer, InfinitePagination, KeyValueList, ListRow, Metric, MetricGroup, Pagination, SelectionBar, sortDataRows, useDataColumnVisibility, type DataColumn, type DataSort, type DataToolbarFilter } from '@precision-calm/ui';
import { StateView } from '@precision-calm/ui';
import { useReferenceCopy } from '../ReferenceCopy';

type CardRecord = {
  id: string;
  name: string;
  issuer: string;
  annualFee: number;
  value: number;
  utilization: number;
  status: 'Active' | 'Review' | 'Closed';
};

type IssuerFilter = 'all' | 'Chase' | 'American Express';
type StatusFilter = 'all' | 'Active' | 'Review';

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
  { key: 'name', label: 'Card', primary: true, weight: 'lg', sortable: true, sortValue: (row) => row.name, render: (row) => row.name },
  { key: 'issuer', label: 'Issuer', weight: 'md', sortable: true, sortValue: (row) => row.issuer, render: (row) => row.issuer },
  { key: 'fee', label: 'Annual fee', numeric: true, weight: 'sm', sortable: true, sortValue: (row) => row.annualFee, render: (row) => formatCurrency(row.annualFee) },
  { key: 'value', label: 'Reward value', numeric: true, weight: 'sm', sortable: true, sortValue: (row) => row.value, render: (row) => formatCurrency(row.value) },
  { key: 'utilization', label: 'Utilization', numeric: true, weight: 'sm', sortable: true, sortValue: (row) => row.utilization, render: (row) => formatPercent(row.utilization) },
  { key: 'status', label: 'Status', weight: 'sm', sortable: true, sortValue: (row) => row.status, render: (row) => <Badge label={row.status} tone={row.status === 'Active' ? 'positive' : row.status === 'Review' ? 'warning' : 'neutral'} /> },
];

export default function DataDisplayReferenceScreen() {
  const router = usePrecisionRouter();
  const copy = useReferenceCopy();
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState('venture-x');
  const [query, setQuery] = useState('');
  const [issuerFilter, setIssuerFilter] = useState<IssuerFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<DataSort>({ key: 'value', direction: 'desc' });
  const [selectedKeys, setSelectedKeys] = useState<readonly string[]>([]);
  const localizedColumns = useMemo(() => columns.map((column) => ({ ...column, label: copy(column.label) })), [copy]);
  const visibility = useDataColumnVisibility(localizedColumns);
  const pageSize = 4;

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchesQuery = !normalizedQuery || [row.name, row.issuer, row.status].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesIssuer = issuerFilter === 'all' || row.issuer === issuerFilter;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesQuery && matchesIssuer && matchesStatus;
    });
  }, [issuerFilter, query, statusFilter]);

  const sortedRows = useMemo(() => sortDataRows(filteredRows, localizedColumns, sort), [filteredRows, localizedColumns, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const rows = useMemo(() => sortedRows.slice((page - 1) * pageSize, page * pageSize), [page, sortedRows]);
  const effectiveSelectedKey = sortedRows.some((row) => row.id === selectedKey) ? selectedKey : sortedRows[0]?.id;
  const selected = effectiveSelectedKey ? allRows.find((row) => row.id === effectiveSelectedKey) : undefined;
  const hasActiveFilters = Boolean(query) || issuerFilter !== 'all' || statusFilter !== 'all';

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
    setSelectedKeys([]);
  };

  const updateIssuer = (value: IssuerFilter) => {
    setIssuerFilter(value);
    setPage(1);
    setSelectedKeys([]);
  };

  const updateStatus = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
    setSelectedKeys([]);
  };

  const clearFilters = () => {
    setQuery('');
    setIssuerFilter('all');
    setStatusFilter('all');
    setPage(1);
    setSelectedKeys([]);
  };

  const runBulkAction = (label: string) => {
    Alert.alert(label, `${selectedKeys.length} selected card${selectedKeys.length === 1 ? '' : 's'}.`);
    setSelectedKeys([]);
  };

  const filters: readonly DataToolbarFilter[] = [
    { key: 'issuer-all', label: copy('All issuers'), selected: issuerFilter === 'all', onPress: () => updateIssuer('all') },
    { key: 'issuer-chase', label: copy('Issuer: Chase'), selected: issuerFilter === 'Chase', onPress: () => updateIssuer('Chase') },
    { key: 'issuer-amex', label: copy('Issuer: Amex'), selected: issuerFilter === 'American Express', onPress: () => updateIssuer('American Express') },
    { key: 'status-all', label: copy('All statuses'), selected: statusFilter === 'all', onPress: () => updateStatus('all') },
    { key: 'status-active', label: copy('Status: Active'), selected: statusFilter === 'Active', onPress: () => updateStatus('Active') },
    { key: 'status-review', label: copy('Status: Review'), selected: statusFilter === 'Review', onPress: () => updateStatus('Review') },
  ];

  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={(
          <PageHeader
            eyebrow={copy('GATE 09 / DATA & CONTENT')}
            title={copy('Adaptive data workspace')}
            description={copy('Search, filter, inspect, and paginate one semantic dataset while the shared system owns responsive composition, density, formatting, and state hierarchy.')}
            metadata={(
              <HStack gap="sm">
                <Badge label={copy('Responsive data')} tone="positive" />
                <Badge label={copy('Search + filters')} tone="info" />
              </HStack>
            )}
          />
        )}
      >
        <Section>
          <MetricGroup>
            <Metric label={copy('Total annual fees')} value={formatCurrency(allRows.reduce((sum, row) => sum + row.annualFee, 0))} trend={copy('7 cards tracked')} />
            <Metric label={copy('Estimated reward value')} value={formatCurrency(allRows.reduce((sum, row) => sum + row.value, 0))} trend={copy('Synthetic reference data')} trendTone="positive" />
            <Metric label={copy('Average utilization')} value={formatPercent(allRows.reduce((sum, row) => sum + row.utilization, 0) / allRows.length)} trend={copy('Central numeric formatting')} />
          </MetricGroup>
        </Section>

        <Section>
          <Card variant="elevated">
            <VStack gap="lg">
              <SectionHeader
                title={copy('Portfolio cards')}
                description={copy('The toolbar, result state, adaptive table, and pagination behave as one reusable data workspace rather than feature-owned layout fragments.')}
                accessory={<Badge label={`${filteredRows.length} ${copy('records')}`} tone={filteredRows.length ? 'positive' : 'warning'} />}
              />
              <DataToolbar
                searchLabel={copy('Search cards')}
                query={query}
                onQueryChange={updateQuery}
                placeholder={copy('Search card, issuer, or status')}
                filters={filters}
                summary={`${filteredRows.length} ${copy('of')} ${allRows.length} ${copy('cards')}`}
                actions={<HStack gap="sm"><FilterDrawer activeCount={[query, issuerFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length} onClear={clearFilters}><CheckboxGroup id="table-columns" label={copy('Visible table columns')} values={visibility.visibleKeys} onChange={visibility.onVisibleKeysChange} options={localizedColumns.map((column) => ({ value: column.key, label: column.label, disabled: column.primary }))} description={copy('The primary identity column remains visible.')} /></FilterDrawer><Button label={copy('Clear filters')} size="sm" variant="ghost" responsiveWidth="compact-full" disabled={!hasActiveFilters} onPress={clearFilters} /></HStack>}
                testID="card-data-toolbar"
              />
              {filteredRows.length ? (
                <>
                  <AdaptiveDataTable
                    rows={rows}
                    columns={localizedColumns}
                    keyExtractor={(row) => row.id}
                    selectedKey={effectiveSelectedKey}
                    onRowPress={(row) => setSelectedKey(row.id)}
                    sort={sort}
                    onSortChange={setSort}
                    selection={{ selectedKeys, onSelectionChange: (keys) => setSelectedKeys(keys), getRowLabel: (row) => row.name }}
                    columnVisibility={visibility}
                    testID="card-data-table"
                  />
                  <SelectionBar
                    selectedCount={selectedKeys.length}
                    onClear={() => setSelectedKeys([])}
                    description={copy('Bulk actions apply to the current filtered workspace selection.')}
                    actions={[
                      { key: 'archive', label: copy('Archive'), icon: 'archive', onPress: () => runBulkAction(copy('Archive selected')) },
                      { key: 'review', label: copy('Mark for review'), variant: 'secondary', icon: 'warning', onPress: () => runBulkAction(copy('Mark selected for review')) },
                      { key: 'delete', label: copy('Delete'), variant: 'danger', icon: 'trash', onPress: () => runBulkAction(copy('Delete selected')) },
                    ]}
                    testID="card-selection-bar"
                  />
                  <Pagination page={page} pageCount={pageCount} onChange={setPage} />
                  <CursorPagination hasPreviousPage={page > 1} hasNextPage={page < pageCount} onPreviousPage={() => setPage((current) => Math.max(1, current - 1))} onNextPage={() => setPage((current) => Math.min(pageCount, current + 1))} />
                  <InfinitePagination hasNextPage={page < pageCount} onLoadMore={() => setPage((current) => Math.min(pageCount, current + 1))} label="Load next sample page" />
                </>
              ) : (
                <StateView
                  kind="noResults"
                  title={copy('No cards match')}
                  message={copy('Try a broader search or clear one of the active filters.')}
                  actionLabel={copy('Clear filters')}
                  onAction={clearFilters}
                />
              )}
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card variant="subtle" padding="compact">
            <VStack gap="lg">
              <SectionHeader title={copy('Selected record')} description={copy('Contextual details recompose from horizontal key/value rows to stacked mobile records without feature-owned geometry.')} />
              {selected ? <KeyValueList testID="selected-record-details" items={[
                { key: 'card', label: copy('Card'), value: selected.name },
                { key: 'issuer', label: copy('Issuer'), value: selected.issuer },
                { key: 'fee', label: copy('Annual fee'), value: formatCurrency(selected.annualFee) },
                { key: 'value', label: copy('Reward value'), value: formatCurrency(selected.value) },
                { key: 'utilization', label: copy('Utilization'), value: formatPercent(selected.utilization) },
              ]} /> : <StateView kind="empty" title={copy('No record selected')} message={copy('Clear the current filters to restore selectable records.')} actionLabel={copy('Clear filters')} onAction={clearFilters} />}
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card padding="compact">
            <VStack gap="md">
              <SectionHeader title={copy('List-row content primitive')} description={copy('Dense records share interaction, inset, and semantic hierarchy across list and data surfaces.')} />
              <ListRow title={copy('Upcoming annual-fee review')} subtitle={copy('A dense, reusable content row retains 44px+ interaction safety and token-owned geometry.')} leadingIcon="clock" trailing={<Badge label="12 days" tone="warning" />} onPress={() => Alert.alert(copy('Review opened'))} />
              <ListRow title={copy('Transfer bonus detected')} subtitle={copy('A second content pattern uses the same visual hierarchy across web and native.')} leadingIcon="gift" trailing={<Badge label="+20%" tone="positive" />} onPress={() => Alert.alert(copy('Bonus opened'))} />
            </VStack>
          </Card>
        </Section>

        <Section>
          <HStack gap="sm">
            <Button label={copy('Back to foundations')} variant="secondary" iconStart="arrowLeft" responsiveWidth="compact-full" onPress={() => router.replace('/')} />
            <Button label={copy('Continue to visualization')} iconEnd="arrowRight" responsiveWidth="compact-full" onPress={() => router.push('/visualization')} />
          </HStack>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
