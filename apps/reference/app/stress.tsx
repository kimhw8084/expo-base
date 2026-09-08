import { useState } from 'react';
import { ScrollScreen, Page, PageHeader, Section, AdaptiveGrid, AdaptiveGridItem, PriorityAction, PriorityActionBar } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { TextField } from '@precision-calm/ui';
import { AlertBanner, AsyncStateView } from '@precision-calm/ui';
import { KeyValueList, ListRow, Metric, MetricGroup } from '@precision-calm/ui';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { useReferenceCopy } from '../ReferenceCopy';

const veryLongName = 'Alexandria Maximiliana von Example-Something-With-An-Intentionally-Long-Unbroken-Product-Context';
const longGerman = 'Jahresgebührenüberprüfungsbenachrichtigung und Überweisungsoptimierungseinstellungen';
const longJapanese = 'アカウント接続と年間特典の最適化に関する詳細設定と通知オプション';

export default function StressReferenceScreen() {
  const router = usePrecisionRouter();
  const copy = useReferenceCopy();
  const [value, setValue] = useState(veryLongName);
  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow={copy('GATE 14 / TORTURE MATRIX')} title={copy('Pathological-content acceptance')} description={copy('This screen intentionally feeds the design system long labels, large values, multilingual content, stale-data conditions and constrained action groups. It should wrap or adapt without overlap, clipping or page-level horizontal scrolling.')} actions={<Button label={copy('Component lab')} variant="secondary" onPress={() => router.replace('/system')} />}/>}>
        <Section>
          <Text variant="h2">{copy('Extreme values')}</Text>
          <MetricGroup><Metric label={copy('Very large currency')} value="$9,999,999,999.99" trend="+999.99%" trendTone="positive" /><Metric label={copy('Negative balance')} value="−$8,420,293.18" trend={copy('Requires attention')} trendTone="negative" /><Metric label={copy('Large points balance')} value="123,456,789 pts" trend={copy('Across 18 programs')} /></MetricGroup>
        </Section>

        <Section>
          <Text variant="h2">{copy('Long and multilingual text')}</Text>
          <AdaptiveGrid>
            <AdaptiveGridItem><Card><VStack gap="md"><Text variant="micro" tone="secondary">{copy('LONG ENGLISH')}</Text><Text variant="h3">{veryLongName}</Text><Text tone="secondary">{copy('A deliberately verbose description that must be allowed to wrap naturally without requiring feature code to specify a width, line count, font reduction, or clipping workaround.')}</Text></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="md"><Text variant="micro" tone="secondary">{copy('GERMAN-LENGTH STRESS')}</Text><Text variant="h3">{longGerman}</Text><Badge label={copy('Review required')} tone="warning" /></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="md"><Text variant="micro" tone="secondary">{copy('NON-LATIN STRESS')}</Text><Text variant="h3">{longJapanese}</Text><Text tone="secondary">東京 · 2026年8月30日 · 123,456 ポイント</Text></VStack></Card></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Text variant="h2">{copy('Action overflow under label pressure')}</Text>
          <Card>
            <PriorityActionBar renderOverflow={(hiddenKeys) => <Button label={copy(`More (${hiddenKeys.length})`)} variant="secondary" onPress={() => {}} />}>
              <PriorityAction actionKey="required" priority="required"><Button label={copy('Save required changes')} onPress={() => {}} /></PriorityAction>
              <PriorityAction actionKey="preferred-a" priority="preferred"><Button label={copy('Compare all available reward configurations')} variant="secondary" onPress={() => {}} /></PriorityAction>
              <PriorityAction actionKey="preferred-b" priority="preferred"><Button label={copy('Export complete transaction history')} variant="outline" onPress={() => {}} /></PriorityAction>
              <PriorityAction actionKey="overflow-a" priority="overflow"><Button label={copy('Share with household member')} variant="ghost" onPress={() => {}} /></PriorityAction>
            </PriorityActionBar>
          </Card>
        </Section>

        <Section>
          <Text variant="h2">{copy('Field expansion and dense records')}</Text>
          <AdaptiveGrid>
            <AdaptiveGridItem span="wide"><Card><VStack gap="lg"><TextField id="stress-long-name" label={copy('Very long profile or account name')} value={value} onChangeText={setValue} description={longGerman} /><ListRow title={veryLongName} subtitle={`${longGerman} · ${longJapanese}`} contentPolicy="wrap" leadingIcon="creditCard" trailing={<Badge label={copy('Needs review')} tone="warning" />} /><KeyValueList items={[{ key: 'owner', label: copy('Extremely descriptive ownership relationship'), value: veryLongName }, { key: 'balance', label: copy('Maximum observed balance'), value: '$9,999,999,999.99' }, { key: 'status', label: copy('Connection status'), value: longGerman }]} /></VStack></Card></AdaptiveGridItem>
            <AdaptiveGridItem><VStack gap="lg"><AlertBanner tone="negative" title={copy('Connection needs attention but existing data remains available')} message={copy('A persistent degraded-state message should coexist with usable content rather than replacing the entire workspace.')} /><AsyncStateView offline itemCount={3} onRetry={() => {}}><Card><VStack gap="sm"><Text variant="h3">{copy('Previously synchronized data')}</Text><Text tone="secondary">{copy('Usable content survives degraded connectivity.')}</Text></VStack></Card></AsyncStateView></VStack></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
