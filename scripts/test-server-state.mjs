import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, '.tmp-server-state');
fs.rmSync(outDir, { recursive: true, force: true });

const compile = spawnSync(path.join(root, 'node_modules', '.bin', 'tsc'), [
  '-p', 'packages/server-state/tsconfig.json', '--noEmit', 'false', '--outDir', outDir,
  '--module', 'commonjs', '--moduleResolution', 'node',
], { cwd: root, encoding: 'utf8' });
if (compile.status !== 0) {
  process.stderr.write(compile.stdout ?? '');
  process.stderr.write(compile.stderr ?? '');
  process.exit(compile.status ?? 1);
}

try {
  fs.writeFileSync(path.join(outDir, 'package.json'), '{"type":"commonjs"}\n');
  const require = createRequire(import.meta.url);
  const { createPrecisionServerStateClient } = require(path.join(outDir, 'client.js'));
  const { PrecisionServerError } = require(path.join(outDir, 'errors.js'));
  const { precisionQueryKey } = require(path.join(outDir, 'keys.js'));
  const { PrecisionMutationController, precisionOptimisticUpdate } = require(path.join(outDir, 'mutation.js'));
  const { toPrecisionAsyncState } = require(path.join(outDir, 'presentation.js'));
  const { resolvePrecisionQueryState } = require(path.join(outDir, 'usePrecisionQuery.js'));

  const canonicalA = precisionQueryKey.list('projects', { status: 'open', page: 2 });
  const canonicalB = precisionQueryKey.list('projects', { page: 2, status: 'open' });
  assert.deepEqual(canonicalA, canonicalB, 'query key objects must be canonical regardless of property order');
  assert.deepEqual(precisionQueryKey.entity('projects', 'p1'), ['projects', 'entity', 'p1']);
  assert.deepEqual(precisionQueryKey.page('projects', { page: 1, pageSize: 25, filters: { owner: 'me' } }), ['projects', 'page', { filters: { owner: 'me' }, page: 1, pageSize: 25 }]);
  assert.deepEqual(precisionQueryKey.cursor('projects', { cursor: null, limit: 20 }), ['projects', 'cursor', { cursor: null, filters: {}, limit: 20 }]);
  assert.throws(() => precisionQueryKey.list('projects', { bad: undefined }), /cannot be undefined/);

  const key = precisionQueryKey.list('projects');
  const client = createPrecisionServerStateClient({ kind: 'session', id: 'user-a', revision: 1 }, { staleTimeMs: 60_000 });
  let loadCount = 0;
  const shared = deferred();
  const load = ({ signal }) => {
    loadCount += 1;
    assert.equal(signal.aborted, false);
    return shared.promise;
  };
  const first = client.fetch({ key, query: load });
  const second = client.fetch({ key, query: load });
  assert.equal(loadCount, 1, 'concurrent identical queries must deduplicate');
  shared.resolve([{ id: 'p1' }]);
  assert.deepEqual(await first, [{ id: 'p1' }]);
  assert.deepEqual(await second, [{ id: 'p1' }]);
  await client.fetch({ key, query: load });
  assert.equal(loadCount, 1, 'fresh cache hits must not call the loader');
  assert.equal(client.getQueryCount(), 1, 'one canonical query must occupy one cache record');

  let retryAttempts = 0;
  const retryResult = await client.fetch({
    key: precisionQueryKey.entity('projects', 'retry'),
    retry: { retries: 2, delayMs: () => 0 },
    query: async () => {
      retryAttempts += 1;
      if (retryAttempts < 3) throw new PrecisionServerError('unavailable', 'Temporarily unavailable.');
      return { id: 'retry' };
    },
  });
  assert.equal(retryAttempts, 3);
  assert.equal(retryResult.id, 'retry');
  let permanentAttempts = 0;
  await assert.rejects(client.fetch({
    key: precisionQueryKey.entity('projects', 'private'),
    retry: { retries: 5, delayMs: () => 0 },
    query: async () => { permanentAttempts += 1; throw new PrecisionServerError('unauthorized', 'Sign in again.'); },
  }), (error) => error.kind === 'unauthorized');
  assert.equal(permanentAttempts, 1, 'authorization failures must never auto-retry');

  let invalidationLoads = 0;
  const invalidationKey = precisionQueryKey.entity('projects', 'invalidate');
  const invalidationLoader = async () => ({ version: ++invalidationLoads });
  assert.deepEqual(await client.fetch({ key: invalidationKey, query: invalidationLoader }), { version: 1 });
  assert.deepEqual(await client.fetch({ key: invalidationKey, query: invalidationLoader }), { version: 1 });
  await client.invalidate(invalidationKey, { exact: true, refetch: 'none' });
  assert.deepEqual(await client.fetch({ key: invalidationKey, query: invalidationLoader }), { version: 2 });
  await client.refetch(invalidationKey, { type: 'all' });
  assert.equal(invalidationLoads, 3, 'manual refetch must intentionally reload inactive cached data');

  const staleClient = createPrecisionServerStateClient({ kind: 'public' }, { staleTimeMs: 0, queryRetry: false });
  const staleKey = precisionQueryKey.list('activity');
  await staleClient.fetch({ key: staleKey, query: async () => ['usable'] });
  await assert.rejects(staleClient.fetch({ key: staleKey, query: async () => { throw new PrecisionServerError('unavailable', 'Refresh failed.'); } }));
  assert.deepEqual(staleClient.getData(staleKey), ['usable'], 'refresh failure must retain usable stale data');

  const raceClient = createPrecisionServerStateClient({ kind: 'session', id: 'race-user', revision: 1 }, { queryRetry: false });
  const raceKey = precisionQueryKey.entity('projects', 'race');
  const oldRequest = deferred();
  const oldPromise = raceClient.fetch({ key: raceKey, query: async () => oldRequest.promise });
  const observedOld = oldPromise.catch((error) => error);
  await raceClient.cancel(raceKey);
  const newValue = await raceClient.fetch({ key: raceKey, query: async () => ({ version: 'new' }) });
  oldRequest.resolve({ version: 'old' });
  await observedOld;
  assert.deepEqual(newValue, { version: 'new' });
  assert.deepEqual(raceClient.getData(raceKey), { version: 'new' }, 'a cancelled late response must not replace newer data');

  const abortClient = createPrecisionServerStateClient({ kind: 'public', id: 'abort' }, { queryRetry: false });
  const abortKey = precisionQueryKey.entity('projects', 'abort');
  let wasAborted = false;
  const abortPromise = abortClient.fetch({
    key: abortKey,
    query: ({ signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => {
      wasAborted = true;
      const error = new Error('Aborted'); error.name = 'AbortError'; reject(error);
    }, { once: true })),
  });
  const observedAbort = abortPromise.catch((error) => error);
  await abortClient.cancel(abortKey);
  await observedAbort;
  assert.equal(wasAborted, true, 'query functions must receive physical cancellation');
  assert.equal(abortClient.getData(abortKey), undefined);

  assert.deepEqual(resolvePrecisionQueryState({ enabled: false, status: 'pending', fetchStatus: 'idle', data: undefined, error: null, isStale: false }), { kind: 'disabled', data: undefined });
  assert.deepEqual(resolvePrecisionQueryState({ enabled: true, status: 'pending', fetchStatus: 'fetching', data: undefined, error: null, isStale: true }), { kind: 'initial-loading' });
  const retained = resolvePrecisionQueryState({ enabled: true, status: 'error', fetchStatus: 'idle', data: ['usable'], error: new PrecisionServerError('unavailable', 'Refresh failed.'), isStale: true });
  assert.equal(retained.kind, 'content');
  assert.equal(retained.refresh.status, 'error');
  assert.deepEqual(toPrecisionAsyncState(retained, 1), { loading: false, error: retained.refresh.error, itemCount: 1 });
  assert.deepEqual(toPrecisionAsyncState({ kind: 'content', data: ['usable'], freshness: 'stale', refresh: { status: 'refreshing' } }, 1), { loading: true, error: null, itemCount: 1 });

  const mutationClient = createPrecisionServerStateClient({ kind: 'session', id: 'mutator', revision: 1 }, { staleTimeMs: 60_000 });
  const mutationKey = precisionQueryKey.list('tasks');
  mutationClient.setData(mutationKey, [{ id: 'one', done: false }]);
  const mutationGate = deferred();
  let mutationCalls = 0;
  const singleFlight = new PrecisionMutationController(mutationClient, {
    mutation: async () => { mutationCalls += 1; return mutationGate.promise; },
  });
  const mutationOne = singleFlight.execute({ id: 'one' });
  const mutationTwo = singleFlight.execute({ id: 'one' });
  assert.equal(mutationOne, mutationTwo, 'single-flight mutations must share the active promise');
  assert.equal(mutationCalls, 1);
  mutationGate.resolve({ id: 'one', done: true });
  assert.deepEqual(await mutationOne, { ok: true, data: { id: 'one', done: true } });
  assert.equal(singleFlight.getSnapshot().status, 'success');

  const optimisticGate = deferred();
  const optimistic = new PrecisionMutationController(mutationClient, {
    mutation: async () => optimisticGate.promise,
    optimistic: () => [precisionOptimisticUpdate(mutationKey, (current = []) => current.map((task) => ({ ...task, done: true })))],
  });
  const optimisticPromise = optimistic.execute({ id: 'one' });
  await until(() => mutationClient.getData(mutationKey)?.[0]?.done === true);
  optimisticGate.reject(new PrecisionServerError('conflict', 'The task changed elsewhere.'));
  const optimisticOutcome = await optimisticPromise;
  assert.equal(optimisticOutcome.ok, false);
  assert.deepEqual(mutationClient.getData(mutationKey), [{ id: 'one', done: false }], 'failed optimistic mutation must rollback exactly');

  let invalidatedLoads = 0;
  const mutationInvalidationKey = precisionQueryKey.list('tasks-invalidation');
  await mutationClient.fetch({ key: mutationInvalidationKey, query: async () => [{ id: `load-${++invalidatedLoads}`, done: false }] });
  const invalidating = new PrecisionMutationController(mutationClient, {
    mutation: async () => ({ saved: true }),
    invalidate: [mutationInvalidationKey],
  });
  assert.equal((await invalidating.execute({ id: 'one' })).ok, true);
  await mutationClient.fetch({ key: mutationInvalidationKey, query: async () => [{ id: `load-${++invalidatedLoads}`, done: false }] });
  assert.equal(invalidatedLoads, 2, 'successful mutation invalidation must make the next query reload');

  const replaceGate = deferred();
  const replaceKey = precisionQueryKey.entity('tasks', 'replace');
  const replace = new PrecisionMutationController(mutationClient, {
    concurrency: 'replace',
    mutation: async ({ variables }) => variables === 'old' ? replaceGate.promise : 'new',
    onSuccess: (value) => { mutationClient.setData(replaceKey, value); },
  });
  const oldMutation = replace.execute('old');
  const newMutation = replace.execute('new');
  assert.deepEqual(await newMutation, { ok: true, data: 'new' });
  assert.equal(replace.getSnapshot().status, 'success', 'replacement state must not wait for an adapter that ignored abort');
  replaceGate.resolve('old');
  const oldOutcome = await oldMutation;
  assert.equal(oldOutcome.ok, false);
  assert.equal(oldOutcome.error.kind, 'cancelled');
  assert.equal(mutationClient.getData(replaceKey), 'new', 'superseded mutation completion must not commit');

  const queueOrder = [];
  const queue = new PrecisionMutationController(mutationClient, {
    concurrency: 'queue',
    mutation: async ({ variables }) => { queueOrder.push(variables); return variables; },
  });
  const queued = await Promise.all([queue.execute(1), queue.execute(2), queue.execute(3)]);
  assert.deepEqual(queueOrder, [1, 2, 3]);
  assert.ok(queued.every((outcome) => outcome.ok));

  const scoped = createPrecisionServerStateClient({ kind: 'session', id: 'first-user', revision: 1 });
  const privateKey = precisionQueryKey.entity('profile', 'me');
  scoped.setData(privateKey, { owner: 'first-user' });
  assert.equal(scoped.resetScope({ kind: 'session', id: 'second-user', revision: 1 }), true);
  assert.equal(scoped.getData(privateKey), undefined, 'a new user scope must start with no previous-user data');
  scoped.setData(privateKey, { owner: 'second-user' });
  assert.equal(scoped.resetScope({ kind: 'session', id: 'second-user', revision: 2 }), true);
  assert.equal(scoped.getData(privateKey), undefined, 'a replacement session revision must clear the prior cache');

  for (const disposable of [client, staleClient, raceClient, abortClient, mutationClient, scoped]) disposable.clear();
  for (const controller of [singleFlight, optimistic, invalidating, replace, queue]) controller.dispose();
  console.log(`Server-state tests passed (dedupe ${loadCount}:2 consumers, cache hit ${loadCount}:2 reads, ${retryAttempts} retry attempts, ${invalidationLoads} refresh loads, query/mutation/scope/feedback lifecycle).`);
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((nextResolve, nextReject) => { resolve = nextResolve; reject = nextReject; });
  return { promise, resolve, reject };
}

async function until(predicate) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await Promise.resolve();
  }
  assert.fail('Condition did not become true within deterministic microtask turns.');
}
