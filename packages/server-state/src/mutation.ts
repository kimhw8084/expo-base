import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { normalizeExpoBaseServerError, ExpoBaseServerError } from './errors';
import type { ExpoBaseQueryKey } from './keys';
import { expoBaseRetryDelayMs, shouldRetryExpoBaseQuery, type ExpoBaseRetryPolicy } from './policy';
import { type ExpoBaseServerStateClient } from './client';
import { useExpoBaseServerState } from './ExpoBaseServerStateProvider';

export type ExpoBaseMutationConcurrency = 'single-flight' | 'queue' | 'replace' | 'parallel';

export type ExpoBaseMutationState<TResult> =
  | { status: 'idle'; pendingCount: 0; data: undefined; error: null }
  | { status: 'pending'; pendingCount: number; data: TResult | undefined; error: null }
  | { status: 'success'; pendingCount: 0; data: TResult; error: null }
  | { status: 'error'; pendingCount: 0; data: undefined; error: ExpoBaseServerError };

export type ExpoBaseMutationOutcome<TResult> =
  | { ok: true; data: TResult }
  | { ok: false; error: ExpoBaseServerError };

export interface ExpoBaseMutationFunctionContext<TVariables> {
  variables: TVariables;
  signal: AbortSignal;
}

export interface ExpoBaseOptimisticUpdate {
  key: ExpoBaseQueryKey;
  apply(current: unknown): unknown;
}

export function expoBaseOptimisticUpdate<TData>(
  key: ExpoBaseQueryKey,
  apply: (current: TData | undefined) => TData,
): ExpoBaseOptimisticUpdate {
  return { key, apply: (current) => apply(current as TData | undefined) };
}

export interface ExpoBaseMutationOptions<TVariables, TResult> {
  mutation: (context: ExpoBaseMutationFunctionContext<TVariables>) => Promise<TResult>;
  /** Defaults to single-flight, matching useExpoBaseAsyncAction for repeated taps. */
  concurrency?: ExpoBaseMutationConcurrency | undefined;
  /** Mutations do not retry unless an explicit bounded policy is supplied. */
  retry?: ExpoBaseRetryPolicy | false | undefined;
  optimistic?: ((variables: TVariables) => readonly ExpoBaseOptimisticUpdate[]) | undefined;
  invalidate?: readonly ExpoBaseQueryKey[] | ((result: TResult | undefined, variables: TVariables) => readonly ExpoBaseQueryKey[]) | undefined;
  invalidateOn?: 'success' | 'settled' | undefined;
  onSuccess?: ((result: TResult, variables: TVariables, client: ExpoBaseServerStateClient) => void | Promise<void>) | undefined;
  onError?: ((error: ExpoBaseServerError, variables: TVariables, client: ExpoBaseServerStateClient) => void | Promise<void>) | undefined;
}

export interface ExpoBaseMutation<TResult, TVariables> {
  state: ExpoBaseMutationState<TResult>;
  execute(variables: TVariables): Promise<ExpoBaseMutationOutcome<TResult>>;
  reset(): void;
}

interface ActiveExecution {
  controller: AbortController;
  rollback: (() => void) | null;
}

interface Snapshot {
  key: ExpoBaseQueryKey;
  data: unknown;
}

const cancelledOutcome = <TResult>(): ExpoBaseMutationOutcome<TResult> => ({
  ok: false,
  error: new ExpoBaseServerError('cancelled', 'The request was cancelled.', { retryable: false }),
});

/** Headless controller used by the hook and deterministic contract tests. */
export class ExpoBaseMutationController<TVariables, TResult> {
  readonly #client: ExpoBaseServerStateClient;
  #options: ExpoBaseMutationOptions<TVariables, TResult>;
  #state: ExpoBaseMutationState<TResult> = { status: 'idle', pendingCount: 0, data: undefined, error: null };
  #listeners = new Set<() => void>();
  #active = new Map<number, ActiveExecution>();
  #singleFlight: Promise<ExpoBaseMutationOutcome<TResult>> | null = null;
  #queue: Promise<unknown> = Promise.resolve();
  #sequence = 0;
  #latestSequence = 0;
  #pendingCount = 0;
  #generation = 0;
  #preFinished = new Set<number>();
  #latestSettledState: ExpoBaseMutationState<TResult> = this.#state;
  #disposed = false;

  constructor(client: ExpoBaseServerStateClient, options: ExpoBaseMutationOptions<TVariables, TResult>) {
    this.#client = client;
    this.#options = options;
    validateMutationOptions(options);
  }

  setOptions(options: ExpoBaseMutationOptions<TVariables, TResult>): void {
    validateMutationOptions(options);
    this.#options = options;
  }

  getSnapshot = (): ExpoBaseMutationState<TResult> => this.#state;
  subscribe = (listener: () => void): (() => void) => { this.#listeners.add(listener); return () => this.#listeners.delete(listener); };

  execute(variables: TVariables): Promise<ExpoBaseMutationOutcome<TResult>> {
    if (this.#disposed) return Promise.resolve(cancelledOutcome());
    const concurrency = this.#options.concurrency ?? 'single-flight';
    if (concurrency === 'single-flight' && this.#singleFlight) return this.#singleFlight;
    if (concurrency === 'replace') {
      const replaced = this.#cancelActive(true, true);
      this.#pendingCount = Math.max(0, this.#pendingCount - replaced);
    }

    const sequence = ++this.#sequence;
    this.#latestSequence = sequence;
    const generation = this.#generation;
    this.#pendingCount += 1;
    this.#publish({ status: 'pending', pendingCount: this.#pendingCount, data: this.#state.status === 'success' ? this.#state.data : undefined, error: null });

    const run = () => this.#run(sequence, generation, variables);
    const promise = concurrency === 'queue'
      ? this.#queue.then(run, run)
      : run();
    if (concurrency === 'queue') this.#queue = promise.then(() => undefined, () => undefined);
    const settled = promise.then((outcome) => {
      this.#finish(sequence, generation, outcome);
      return outcome;
    });
    if (concurrency === 'single-flight') {
      this.#singleFlight = settled;
      void settled.finally(() => { if (this.#singleFlight === settled) this.#singleFlight = null; });
    }
    return settled;
  }

  reset(): void {
    this.#generation += 1;
    this.#cancelActive(true);
    this.#pendingCount = 0;
    this.#preFinished.clear();
    this.#singleFlight = null;
    this.#latestSettledState = { status: 'idle', pendingCount: 0, data: undefined, error: null };
    this.#publish(this.#latestSettledState);
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.reset();
    this.#listeners.clear();
  }

  async #run(sequence: number, generation: number, variables: TVariables): Promise<ExpoBaseMutationOutcome<TResult>> {
    if (!this.#isCurrent(generation, sequence)) return cancelledOutcome();
    const controller = new AbortController();
    const execution: ActiveExecution = { controller, rollback: null };
    this.#active.set(sequence, execution);
    let result: TResult | undefined;
    try {
      const updates = this.#options.optimistic?.(variables) ?? [];
      if (updates.length) {
        await Promise.all(updates.map((update) => this.#client.cancel(update.key)));
        if (!this.#isCurrent(generation, sequence)) return cancelledOutcome();
        const snapshots: Snapshot[] = updates.map((update) => ({ key: update.key, data: this.#client.getData(update.key) }));
        for (const update of updates) this.#client.setData(update.key, update.apply(this.#client.getData(update.key)));
        execution.rollback = () => {
          for (const snapshot of snapshots) {
            if (snapshot.data === undefined) this.#client.remove(snapshot.key);
            else this.#client.setData(snapshot.key, snapshot.data);
          }
        };
      }

      result = await this.#runWithRetry(variables, controller.signal);
      if (!this.#isCurrent(generation, sequence)) {
        execution.rollback?.();
        return cancelledOutcome();
      }
      await this.#options.onSuccess?.(result, variables, this.#client);
      await this.#invalidate(result, variables, 'success');
      return { ok: true, data: result };
    } catch (error) {
      const normalized = normalizeExpoBaseServerError(error);
      execution.rollback?.();
      if (!this.#isCurrent(generation, sequence) || normalized.kind === 'cancelled') return cancelledOutcome();
      try { await this.#options.onError?.(normalized, variables, this.#client); } catch { /* Error reporting must not hide the mutation error. */ }
      await this.#invalidate(undefined, variables, 'error');
      return { ok: false, error: normalized };
    } finally {
      this.#active.delete(sequence);
    }
  }

  async #runWithRetry(variables: TVariables, signal: AbortSignal): Promise<TResult> {
    let failureCount = 0;
    while (true) {
      if (signal.aborted) throw abortError();
      try { return await this.#options.mutation({ variables, signal }); }
      catch (error) {
        const normalized = normalizeExpoBaseServerError(error);
        if (signal.aborted || !shouldRetryExpoBaseQuery(failureCount, normalized, this.#options.retry ?? false)) throw normalized;
        const delay = expoBaseRetryDelayMs(failureCount, normalized, this.#options.retry);
        failureCount += 1;
        await waitForRetry(delay, signal);
      }
    }
  }

  async #invalidate(result: TResult | undefined, variables: TVariables, outcome: 'success' | 'error'): Promise<void> {
    const invalidateOn = this.#options.invalidateOn ?? 'success';
    if (outcome === 'error' && invalidateOn !== 'settled') return;
    const configured = this.#options.invalidate;
    const keys = typeof configured === 'function' ? configured(result, variables) : configured ?? [];
    await Promise.all(keys.map((key) => this.#client.invalidate(key)));
  }

  #finish(sequence: number, generation: number, outcome: ExpoBaseMutationOutcome<TResult>): void {
    if (generation !== this.#generation || this.#disposed) return;
    if (this.#preFinished.delete(sequence)) return;
    this.#pendingCount = Math.max(0, this.#pendingCount - 1);
    if (sequence === this.#latestSequence) {
      this.#latestSettledState = outcome.ok
        ? { status: 'success', pendingCount: 0, data: outcome.data, error: null }
        : outcome.error.kind === 'cancelled'
          ? { status: 'idle', pendingCount: 0, data: undefined, error: null }
          : { status: 'error', pendingCount: 0, data: undefined, error: outcome.error };
    }
    if (this.#pendingCount > 0) this.#publish({ status: 'pending', pendingCount: this.#pendingCount, data: undefined, error: null });
    else this.#publish(this.#latestSettledState);
  }

  #cancelActive(rollback: boolean, settlePending = false): number {
    let count = 0;
    for (const [sequence, execution] of this.#active) {
      execution.controller.abort();
      if (rollback) {
        execution.rollback?.();
        execution.rollback = null;
      }
      if (settlePending) this.#preFinished.add(sequence);
      count += 1;
    }
    this.#active.clear();
    return count;
  }

  #isCurrent(generation: number, sequence: number): boolean {
    if (this.#disposed || generation !== this.#generation) return false;
    return (this.#options.concurrency ?? 'single-flight') !== 'replace' || sequence === this.#latestSequence;
  }

  #publish(state: ExpoBaseMutationState<TResult>): void {
    this.#state = state;
    for (const listener of this.#listeners) listener();
  }
}

export function useExpoBaseMutation<TVariables, TResult>(options: ExpoBaseMutationOptions<TVariables, TResult>): ExpoBaseMutation<TResult, TVariables> {
  const client = useExpoBaseServerState();
  const controller = useMemo(() => new ExpoBaseMutationController(client, options), [client]);
  controller.setOptions(options);
  useEffect(() => () => controller.dispose(), [controller]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const execute = useCallback((variables: TVariables) => controller.execute(variables), [controller]);
  const reset = useCallback(() => controller.reset(), [controller]);
  return useMemo(() => ({ state, execute, reset }), [state, execute, reset]);
}

function validateMutationOptions<TVariables, TResult>(options: ExpoBaseMutationOptions<TVariables, TResult>): void {
  if (options.optimistic && options.concurrency === 'parallel') {
    throw new Error('Parallel optimistic mutations are ambiguous. Use single-flight, queue, or replace, or remove optimistic bookkeeping.');
  }
}

function waitForRetry(delayMs: number, signal: AbortSignal): Promise<void> {
  if (delayMs <= 0) return signal.aborted ? Promise.reject(abortError()) : Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, delayMs);
    const onAbort = () => { clearTimeout(timeout); reject(abortError()); };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function abortError(): Error {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}
