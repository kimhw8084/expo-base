import { useState } from 'react';
import { ScrollScreen, Page, PageHeader, Section, AdaptiveGrid, AdaptiveGridItem } from '@precision-calm/ui';
import { DensityProvider, HStack, Text, ThemeScope, VStack } from '@precision-calm/ui';
import { Avatar, Badge, Button, Card, Chip, IconButton, Link, Tag } from '@precision-calm/ui';
import { Checkbox, CurrencyField, PasswordField, RadioGroup, SearchField, SelectField, SwitchField, TextArea, TextField } from '@precision-calm/ui';
import { AlertBanner, LoadingState, StateView } from '@precision-calm/ui';
import { KeyValueList, ListRow, Metric, MetricGroup } from '@precision-calm/ui';
import { BarChart, LineChart, ProgressBar, ProgressRing, Sparkline } from '@precision-calm/ui';
import { usePrecisionRouter } from '@precision-calm/navigation-router';

const trend = [
  { label: 'Jan', value: 6200 }, { label: 'Feb', value: 6480 }, { label: 'Mar', value: 6310 },
  { label: 'Apr', value: 6840 }, { label: 'May', value: 7010 }, { label: 'Jun', value: 7380 },
  { label: 'Jul', value: 7210 }, { label: 'Aug', value: 8420 },
];
const bars = [
  { label: 'Travel', value: 1420 }, { label: 'Dining', value: 980 }, { label: 'Other', value: 620 },
];

export default function SystemReferenceScreen() {
  const router = usePrecisionRouter();
  const [search, setSearch] = useState('');
  const [password, setPassword] = useState('example-password');
  const [amount, setAmount] = useState('8420');
  const [notes, setNotes] = useState('A controlled text area with semantic geometry.');
  const [selected, setSelected] = useState('capital-one');
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState('comfortable');
  const [enabled, setEnabled] = useState(true);
  const [chip, setChip] = useState('all');

  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow="GATE 14 / COMPONENT LAB" title="System acceptance laboratory" description="A single route exercising public components in realistic combinations so theme, density, interaction and responsive regressions are visible before product migration." actions={<HStack gap="sm"><Button label="Stress cases" variant="secondary" iconEnd="arrowRight" onPress={() => router.push('/stress')} /><Button label="Home" variant="ghost" onPress={() => router.replace('/')} /></HStack>} />}
      >
        <Section>
          <Text variant="h2">Theme and density invariants</Text>
          <AdaptiveGrid>
            <AdaptiveGridItem><ThemeScope name="light"><Card><VStack gap="md"><Text variant="micro" tone="secondary">FORCED LIGHT</Text><Text variant="h3">Semantic light surface</Text><Text tone="secondary">Geometry is shared with dark mode; only semantic visual tokens change.</Text><Button label="Light action" onPress={() => {}} /></VStack></Card></ThemeScope></AdaptiveGridItem>
            <AdaptiveGridItem><ThemeScope name="dark"><Card><VStack gap="md"><Text variant="micro" tone="secondary">FORCED DARK</Text><Text variant="h3">Semantic dark surface</Text><Text tone="secondary">Near-black surfaces use independently designed contrast and elevation values.</Text><Button label="Dark action" onPress={() => {}} /></VStack></Card></ThemeScope></AdaptiveGridItem>
            <AdaptiveGridItem><DensityProvider density="compact"><Card><VStack gap="xl"><Text variant="micro" tone="secondary">COMPACT DENSITY</Text><Text variant="h3">More information, same interaction safety</Text><ListRow title="Compact row A" subtitle="Spacing compresses; semantic hierarchy remains intact." onPress={() => {}} /><ListRow title="Compact row B" subtitle="Touch-oriented controls retain safe interaction bounds." onPress={() => {}} /></VStack></Card></DensityProvider></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Text variant="h2">Actions and identity</Text>
          <Card>
            <VStack gap="lg">
              <HStack gap="sm"><Button label="Primary" onPress={() => {}} /><Button label="Secondary" variant="secondary" onPress={() => {}} /><Button label="Outline" variant="outline" onPress={() => {}} /><Button label="Ghost" variant="ghost" onPress={() => {}} /><Button label="Danger" variant="danger" onPress={() => {}} /></HStack>
              <HStack gap="sm"><Button label="Loading" loading onPress={() => {}} /><Button label="Disabled" disabled onPress={() => {}} /><IconButton icon="search" label="Search" onPress={() => {}} /><IconButton icon="settings" label="Settings" onPress={() => {}} /><Avatar label="Alex Kim" /><Badge label="Approved" tone="positive" /><Tag label="Portable" /><Link label="Documentation link" onPress={() => {}} /></HStack>
              <HStack gap="sm"><Chip label="All" selected={chip === 'all'} onPress={() => setChip('all')} /><Chip label="Rewards" selected={chip === 'rewards'} onPress={() => setChip('rewards')} /><Chip label="Travel" selected={chip === 'travel'} onPress={() => setChip('travel')} /></HStack>
            </VStack>
          </Card>
        </Section>

        <Section>
          <Text variant="h2">Forms and selection</Text>
          <AdaptiveGrid>
            <AdaptiveGridItem span="wide"><Card><VStack gap="lg"><TextField label="Account nickname" value="Travel setup" onChangeText={() => {}} description="Visible labels and helper text remain part of the field contract." /><SearchField label="Search" value={search} onChangeText={setSearch} placeholder="Search cards, rewards, institutions" /><PasswordField label="Password" value={password} onChangeText={setPassword} /><CurrencyField label="Tracked value" value={amount} onChangeText={setAmount} /><TextArea label="Notes" value={notes} onChangeText={setNotes} /><SelectField id="institution" label="Institution" value={selected} onChange={setSelected} options={[{ value: 'capital-one', label: 'Capital One' }, { value: 'amex', label: 'American Express' }, { value: 'chase', label: 'Chase' }]} /></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="lg"><Checkbox label="Include annual fees" checked={checked} onChange={setChecked} description="Selection rows share interaction geometry." /><SwitchField label="Notifications" value={enabled} onChange={setEnabled} description="Bonus and deadline alerts" /><RadioGroup label="Density" value={radio} onChange={setRadio} options={[{ value: 'comfortable', label: 'Comfortable', description: 'Default touch-oriented density' }, { value: 'compact', label: 'Compact', description: 'Higher-density desktop workflows' }]} /></VStack></Card></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Text variant="h2">Information and visualization</Text>
          <MetricGroup><Metric label="Tracked value" value="$8,420" trend="+14.2% YTD" trendTone="positive" /><Metric label="Annual fees" value="$1,215" trend="6 active products" /><Metric label="Upcoming value" value="$1,090" trend="3 benefits" /></MetricGroup>
          <AdaptiveGrid>
            <AdaptiveGridItem span="wide"><Card><VStack gap="lg"><Text variant="h3">Value trend</Text><LineChart data={trend} area /><Sparkline data={trend} name="Tracked value trend" /></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="lg"><Text variant="h3">Category mix</Text><BarChart data={bars} /><HStack gap="lg"><ProgressRing value={0.72} label="72% goal progress" /><VStack gap="sm"><Text variant="label">Bonus progress</Text><ProgressBar value={0.72} label="72% complete" /></VStack></HStack></VStack></Card></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Text variant="h2">Content and status</Text>
          <AdaptiveGrid>
            <AdaptiveGridItem span="wide"><Card><VStack gap="sm"><ListRow title="Venture X" subtitle="Capital One · Updated 4 min ago" leadingIcon="creditCard" trailing={<Badge label="Active" tone="positive" />} /><ListRow title="Gold Card" subtitle="American Express · Annual fee review" leadingIcon="creditCard" trailing={<Badge label="Review" tone="warning" />} /><ListRow title="Sapphire Preferred" subtitle="Chase · Travel category" leadingIcon="creditCard" /><KeyValueList items={[{ key: 'scope', label: 'Scope', value: 'All cards' }, { key: 'updated', label: 'Updated', value: '4 min ago' }, { key: 'privacy', label: 'Privacy', value: 'Protected' }]} /></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><VStack gap="lg"><AlertBanner tone="info" title="System message" message="Feedback colors and spacing are semantic across both themes." /><AlertBanner tone="warning" title="Annual fee in 12 days" message="Review retention value before renewal." /><StateView kind="empty" title="No matching activity" message="Change filters or broaden the date range." actionLabel="Clear filters" onAction={() => {}} /><LoadingState label="Loading account activity" /></VStack></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
