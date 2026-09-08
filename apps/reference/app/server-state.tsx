import { useMemo, useState } from 'react';
import {
  precisionOptimisticUpdate,
  precisionQueryKey,
  toPrecisionAsyncState,
  usePrecisionMutation,
  usePrecisionQuery,
  type PrecisionQueryKey,
} from '@precision-calm/server-state';
import { usePrecisionServices } from '@precision-calm/runtime';
import {
  AsyncStateView,
  Badge,
  Button,
  Card,
  ListRow,
  Page,
  PageHeader,
  ScrollScreen,
  Section,
  SectionHeader,
  Text,
  VStack,
} from '@precision-calm/ui';
import type { ReferenceServices } from '../services';
import type { ReferenceTask } from '../serverState';
import { ReferenceBackAction } from '../ReferenceBackAction';
import { useReferenceCopy } from '../ReferenceCopy';
import { useReferenceRuntimeSettings } from '../ReferenceRuntimeSettings';

type TeamFilter = 'all' | ReferenceTask['team'];

function useTaskQuery(team: TeamFilter, key: PrecisionQueryKey) {
  const { serverStateLab } = usePrecisionServices<ReferenceServices>();
  return usePrecisionQuery({ key, query: ({ signal }) => serverStateLab.list(team, signal) });
}

function SharedQueryConsumer({ label, team, queryKey }: { label: string; team: TeamFilter; queryKey: PrecisionQueryKey }) {
  const query = useTaskQuery(team, queryKey);
  const count = query.state.kind === 'content' ? query.state.data.length : 0;
  return <Badge label={`${label}: ${query.state.kind} · ${count}`} tone={query.state.kind === 'error' ? 'negative' : 'neutral'} />;
}

export default function ServerStateReferenceScreen() {
  const { serverStateLab } = usePrecisionServices<ReferenceServices>();
  const copy = useReferenceCopy();
  const { density, setDensity } = useReferenceRuntimeSettings();
  const [team, setTeam] = useState<TeamFilter>('all');
  const queryKey = useMemo(() => precisionQueryKey.list('reference-tasks', { team }), [team]);
  const query = useTaskQuery(team, queryKey);
  const tasks = query.state.kind === 'content' ? query.state.data : [];
  const asyncState = toPrecisionAsyncState(query.state, tasks.length);
  const toggle = usePrecisionMutation<{ id: string }, ReferenceTask>({
    mutation: ({ variables, signal }) => serverStateLab.toggle(variables.id, signal),
    optimistic: ({ id }) => [precisionOptimisticUpdate<readonly ReferenceTask[]>(queryKey, (current = []) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task))],
    invalidate: [precisionQueryKey.family('reference-tasks')],
  });

  const firstTask = tasks[0];
  return (
    <ScrollScreen>
      <Page
        width="standard"
        header={<PageHeader eyebrow={copy('GOLDEN PHASE 3')} title={copy('Server-state lifecycle laboratory')} description={copy('One scoped query owner coordinates identity, cache, stale refresh, cancellation, mutation invalidation, and optimistic rollback across consumers.')} actions={<ReferenceBackAction />} />}
      >
        <Section>
          <SectionHeader title={copy('Shared query identity')} description={copy('Three consumers use one deterministic key; the service receives one request.')} />
          <Card>
            <VStack gap="md">
              <Text testID="server-state-load-count">Service requests: {serverStateLab.loadCount}</Text>
              <SharedQueryConsumer label="Consumer A" team={team} queryKey={queryKey} />
              <SharedQueryConsumer label="Consumer B" team={team} queryKey={queryKey} />
              <Button label={copy('Recompose runtime provider')} variant="outline" onPress={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')} />
              <Button label={copy('All tasks')} variant={team === 'all' ? 'primary' : 'secondary'} onPress={() => setTeam('all')} />
              <Button label={copy('Platform tasks')} variant={team === 'platform' ? 'primary' : 'secondary'} onPress={() => setTeam('platform')} />
            </VStack>
          </Card>
        </Section>

        <Section>
          <SectionHeader title={copy('Stale-safe presentation')} description={copy('Refresh errors retain content and map into the shared degraded feedback anatomy.')} />
          <Card>
            <VStack gap="md">
              <AsyncStateView {...asyncState} onRetry={() => { void query.refresh(); }} empty={<Text>{copy('No tasks match this product filter.')}</Text>}>
                {tasks.map((task) => <ListRow key={task.id} title={task.title} subtitle={`${task.team} · ${task.done ? 'Complete' : 'Open'}`} />)}
              </AsyncStateView>
              <Button label={copy('Refresh tasks')} variant="secondary" onPress={() => { void query.refresh(); }} />
              <Button label={copy('Fail next refresh')} variant="outline" onPress={() => { serverStateLab.failNextLoad(); void query.refresh(); }} />
            </VStack>
          </Card>
        </Section>

        <Section>
          <SectionHeader title={copy('Mutation bookkeeping')} description={copy('The product chooses the optimistic update; the shared owner snapshots, rolls back, invalidates, and single-flights.')} />
          <Card>
            <VStack gap="md">
              <Badge label={`Mutation: ${toggle.state.status}`} tone={toggle.state.status === 'error' ? 'negative' : toggle.state.status === 'success' ? 'positive' : 'neutral'} />
              <Text testID="server-state-mutation-count">Mutation requests: {serverStateLab.mutationCount}</Text>
              <Button label={copy('Toggle first task')} loading={toggle.state.status === 'pending'} disabled={!firstTask} onPress={() => { if (firstTask) void toggle.execute({ id: firstTask.id }); }} />
              <Button label={copy('Prove optimistic rollback')} variant="danger" loading={toggle.state.status === 'pending'} disabled={!firstTask} onPress={() => { if (firstTask) { serverStateLab.failNextMutation(); void toggle.execute({ id: firstTask.id }); } }} />
            </VStack>
          </Card>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
