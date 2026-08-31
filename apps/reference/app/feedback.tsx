import { useState } from 'react';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { Page, PageHeader, ScrollScreen, Section, AdaptiveGrid, AdaptiveGridItem } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { Button, Card } from '@precision-calm/ui';
import { AlertBanner, AsyncStateView, InlineMessage, SkeletonList, StateView, type StateKind } from '@precision-calm/ui';
import { ListRow } from '@precision-calm/ui';

const states: StateKind[] = ['empty', 'noResults', 'error', 'offline', 'permission', 'reconnect', 'maintenance'];

export default function FeedbackReferenceScreen() {
  const router = usePrecisionRouter();
  const [kind, setKind] = useState<StateKind>('empty');
  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow="GATE 11 / FEEDBACK" title="The unhappy path is part of the design system" description="Loading, stale content, empty results, errors, offline behavior, permissions, reconnect flows, and persistent alerts use one semantic language instead of feature-specific improvisation." />}
      >
        <Section>
          <AdaptiveGrid>
            <AdaptiveGridItem span="wide">
              <Card><VStack gap="lg"><Text variant="h2">Persistent semantic feedback</Text><AlertBanner tone="info" title="New recommendation available" message="Your current spending pattern may qualify for a stronger dining return." action={<Button label="Review" size="sm" variant="ghost" onPress={() => setKind('empty')} />} /><AlertBanner tone="positive" title="Bonus completed" message="Required spend was reached nine days early." /><AlertBanner tone="warning" title="Annual fee in 12 days" message="Review retention value before the renewal posts." /><AlertBanner tone="negative" title="Connection failed" message="The latest refresh could not be completed." /><InlineMessage tone="info">Inline messages are reserved for local context such as form or section-level status.</InlineMessage></VStack></Card>
            </AdaptiveGridItem>
            <AdaptiveGridItem><Card><VStack gap="lg"><Text variant="h2">Loading skeleton</Text><SkeletonList rows={4} /></VStack></Card></AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h2">State playground</Text>
              <HStack gap="sm">{states.map((state) => <Button key={state} label={state} size="sm" variant={kind === state ? 'primary' : 'secondary'} onPress={() => setKind(state)} />)}</HStack>
              <StateView kind={kind} actionLabel={kind === 'noResults' ? 'Clear filters' : kind === 'empty' ? 'Add item' : 'Try again'} onAction={() => setKind('empty')} />
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h2">Stale-content preservation</Text>
              <Text tone="secondary">Offline/error/refreshing states do not blank already useful content. The resolver keeps content visible and adds a persistent degraded-state banner.</Text>
              <AsyncStateView itemCount={2} offline onRetry={() => setKind('reconnect')}>
                <ListRow title="Venture X" subtitle="Previously loaded data remains usable" leadingIcon="creditCard" />
                <ListRow title="Gold Card" subtitle="Freshness is communicated without destroying context" leadingIcon="creditCard" />
              </AsyncStateView>
            </VStack>
          </Card>
        </Section>

        <Section><HStack gap="sm"><Button label="Back to visualization" variant="secondary" iconStart="arrowLeft" onPress={() => router.replace('/visualization')} /><Button label="Return to foundations" iconEnd="arrowRight" onPress={() => router.replace('/')} /></HStack></Section>
      </Page>
    </ScrollScreen>
  );
}
