import { useState } from 'react';
import { ScrollScreen, Page, PageHeader, Section, AdaptiveGrid, AdaptiveGridItem, PriorityAction, PriorityActionBar } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { TextField } from '@precision-calm/ui';
import { AlertBanner, AsyncStateView } from '@precision-calm/ui';
import { KeyValueList, ListRow, Metric, MetricGroup } from '@precision-calm/ui';
import { usePrecisionRouter } from '@precision-calm/navigation-router';

const veryLongName = 'Alexandria Maximiliana von Example-Something-With-An-Intentionally-Long-Unbroken-Product-Context';
const longGerman = 'Jahresgebührenüberprüfungsbenachrichtigung und Überweisungsoptimierungseinstellungen';
const longJapanese = 'アカウント接続と年間特典の最適化に関する詳細設定と通知オプション';

export default function StressReferenceScreen() {
  const router = usePrecisionRouter();
  const [value, setValue] = useState(veryLongName);
  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow="GATE 14 / TORTURE MATRIX" title="Pathological-content acceptance" description="This screen intentionally feeds the design system long labels, large values, multilingual content, stale-data conditions and constrained action groups. It should wrap or adapt without overlap, clipping or page-level horizontal scrolling." actions={<Button label="Component lab" variant="secondary" onPress={() => router.replace('/system')} />}/>}>
        <Section>
          <Text variant="h2">Extreme values</Text>
          <MetricGroup><Metric label="Very large currency" value="$9,999,999,999.99" trend="+999.99%" trendTone="positive" /><Metric label="Negative balance" value="−$8,420,293.18" trend="Requires attention" trendTone="negative" /><Metric label="Large points balance" value="123,456,789 pts" trend="Across 18 programs" /></MetricGroup>
        </Section>

        <Section>
          <Text variant="h2">Long and multilingual text</Text>
          <AdaptiveGrid>
            <AdaptiveGridItem><Card><VStack gap="md"><Text variant="micro" tone="secondary">LONG ENGLISH</Text><Text variant="h3">{veryLongName}</Text><Text tone="secondary">A deliberately verbose description that must be allowed to wrap naturally without requiring feature code to specify a width, line count, font reduction, or clipping workaround.</Text></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="md"><Text variant="micro" tone="secondary">GERMAN-LENGTH STRESS</Text><Text variant="h3">{longGerman}</Text><Badge label="Überprüfung erforderlich" tone="warning" /></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="md"><Text variant="micro" tone="secondary">NON-LATIN STRESS</Text><Text variant="h3">{longJapanese}</Text><Text tone="secondary">東京 · 2026年8月30日 · 123,456 ポイント</Text></VStack></Card></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Text variant="h2">Action overflow under label pressure</Text>
          <Card>
            <PriorityActionBar renderOverflow={(hiddenKeys) => <Button label={`More (${hiddenKeys.length})`} variant="secondary" onPress={() => {}} />}>
              <PriorityAction actionKey="required" priority="required"><Button label="Save required changes" onPress={() => {}} /></PriorityAction>
              <PriorityAction actionKey="preferred-a" priority="preferred"><Button label="Compare all available reward configurations" variant="secondary" onPress={() => {}} /></PriorityAction>
              <PriorityAction actionKey="preferred-b" priority="preferred"><Button label="Export complete transaction history" variant="outline" onPress={() => {}} /></PriorityAction>
              <PriorityAction actionKey="overflow-a" priority="overflow"><Button label="Share with household member" variant="ghost" onPress={() => {}} /></PriorityAction>
            </PriorityActionBar>
          </Card>
        </Section>

        <Section>
          <Text variant="h2">Field expansion and dense records</Text>
          <AdaptiveGrid>
            <AdaptiveGridItem span="wide"><Card><VStack gap="lg"><TextField label="Very long profile or account name" value={value} onChangeText={setValue} description={longGerman} /><ListRow title={veryLongName} subtitle={`${longGerman} · ${longJapanese}`} leadingIcon="creditCard" trailing={<Badge label="Needs review" tone="warning" />} /><KeyValueList items={[{ key: 'owner', label: 'Extremely descriptive ownership relationship', value: veryLongName }, { key: 'balance', label: 'Maximum observed balance', value: '$9,999,999,999.99' }, { key: 'status', label: 'Connection status', value: longGerman }]} /></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><VStack gap="lg"><AlertBanner tone="negative" title="Connection needs attention but existing data remains available" message="A persistent degraded-state message should coexist with usable content rather than replacing the entire workspace." /><AsyncStateView offline itemCount={3} onRetry={() => {}}><Card><VStack gap="sm"><Text variant="h3">Previously synchronized data</Text><Text tone="secondary">Usable content survives degraded connectivity.</Text></VStack></Card></AsyncStateView></VStack></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
