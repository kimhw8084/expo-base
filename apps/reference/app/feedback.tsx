import { useState } from 'react';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { Page, PageHeader, ScrollScreen, Section, AdaptiveGrid, AdaptiveGridItem } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Button, Card } from '@precision-calm/ui';
import { AlertBanner, AsyncStateView, InlineMessage, SkeletonList, StateView, type StateKind } from '@precision-calm/ui';
import { ListRow } from '@precision-calm/ui';
import { useReferenceCopy } from '../ReferenceCopy';

const states: StateKind[] = ['empty', 'noResults', 'error', 'offline', 'permission', 'reconnect', 'maintenance'];
const stateLabels: Record<StateKind, string> = {
  empty: 'Empty',
  noResults: 'No results',
  error: 'Error',
  offline: 'Offline',
  permission: 'Permission',
  reconnect: 'Reconnect',
  maintenance: 'Maintenance',
};

export default function FeedbackReferenceScreen() {
  const router = usePrecisionRouter();
  const copy = useReferenceCopy();
  const [kind, setKind] = useState<StateKind>('empty');
  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow={copy('GATE 11 / FEEDBACK')} title={copy('The unhappy path is part of the design system')} description={copy('Loading, stale content, empty results, errors, offline behavior, permissions, reconnect flows, and persistent alerts use one semantic language instead of feature-specific improvisation.')} />}
      >
        <Section>
          <AdaptiveGrid>
            <AdaptiveGridItem span="wide">
              <Card><VStack gap="lg"><Text variant="h2">{copy('Persistent semantic feedback')}</Text><AlertBanner tone="info" title={copy('New recommendation available')} message={copy('Your current spending pattern may qualify for a stronger dining return.')} action={<Button label={copy('Review')} size="sm" variant="ghost" responsiveWidth="compact-full" onPress={() => setKind('empty')} />} /><AlertBanner tone="positive" title={copy('Bonus completed')} message={copy('Required spend was reached nine days early.')} /><AlertBanner tone="warning" title={copy('Annual fee in 12 days')} message={copy('Review retention value before the renewal posts.')} /><AlertBanner tone="negative" title={copy('Connection failed')} message={copy('The latest refresh could not be completed.')} /><InlineMessage tone="info">{copy('Inline messages are reserved for local context such as form or section-level status.')}</InlineMessage></VStack></Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem><Card variant="subtle"><VStack gap="lg"><Text variant="h2">{copy('Loading skeleton')}</Text><SkeletonList rows={4} label={copy('Loading account rows')} /></VStack></Card></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h2">{copy('State playground')}</Text>
              <HStack gap="sm">{states.map((state) => <Button key={state} label={copy(stateLabels[state])} size="sm" variant={kind === state ? 'primary' : 'secondary'} onPress={() => setKind(state)} />)}</HStack>
              <StateView kind={kind} actionLabel={copy(kind === 'noResults' ? 'Clear filters' : kind === 'empty' ? 'Add item' : 'Try again')} onAction={() => setKind('empty')} secondaryLabel={kind === 'empty' ? copy('Learn more') : undefined} onSecondary={kind === 'empty' ? () => setKind('noResults') : undefined} />
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h2">{copy('Stale-content preservation')}</Text>
              <Text tone="secondary">{copy('Offline/error/refreshing states do not blank already useful content. The resolver keeps content visible and adds a persistent degraded-state banner.')}</Text>
              <AsyncStateView itemCount={2} offline onRetry={() => setKind('reconnect')}>
                <ListRow title="Venture X" subtitle={copy('Previously loaded data remains usable')} leadingIcon="creditCard" />
                <ListRow title="Gold Card" subtitle={copy('Freshness is communicated without destroying context')} leadingIcon="creditCard" />
              </AsyncStateView>
            </VStack>
          </Card>
        </Section>

        <Section><HStack gap="sm"><Button label={copy('Back to visualization')} variant="secondary" iconStart="arrowLeft" onPress={() => router.replace('/visualization')} /><Button label={copy('Return to foundations')} iconEnd="arrowRight" onPress={() => router.replace('/')} /></HStack></Section>
      </Page>
    </ScrollScreen>
  );
}
