import { PrecisionServerError } from '@precision-calm/server-state';

export interface ReferenceTask {
  id: string;
  title: string;
  team: 'platform' | 'product';
  done: boolean;
}

export class ReferenceServerStateService {
  #tasks: ReferenceTask[] = [
    { id: 'catalog', title: 'Publish Golden Catalog', team: 'platform', done: true },
    { id: 'query', title: 'Adopt shared query lifecycle', team: 'product', done: false },
    { id: 'review', title: 'Review stale-data behavior', team: 'platform', done: false },
  ];
  #remainingLoadFailures = 0;
  #failNextMutation = false;
  loadCount = 0;
  mutationCount = 0;

  /** Exhausts the kernel's initial attempt plus two default retries. */
  failNextLoad(): void { this.#remainingLoadFailures = 3; }
  failNextMutation(): void { this.#failNextMutation = true; }

  async list(team: 'all' | ReferenceTask['team'], signal: AbortSignal): Promise<readonly ReferenceTask[]> {
    this.loadCount += 1;
    await Promise.resolve();
    throwIfAborted(signal);
    if (this.#remainingLoadFailures > 0) {
      this.#remainingLoadFailures -= 1;
      throw new PrecisionServerError('unavailable', 'The latest task refresh failed.', { code: 'reference_refresh_failed' });
    }
    return this.#tasks.filter((task) => team === 'all' || task.team === team).map((task) => ({ ...task }));
  }

  async toggle(id: string, signal: AbortSignal): Promise<ReferenceTask> {
    this.mutationCount += 1;
    await Promise.resolve();
    throwIfAborted(signal);
    if (this.#failNextMutation) {
      this.#failNextMutation = false;
      throw new PrecisionServerError('conflict', 'The optimistic task update was rejected.', { code: 'reference_conflict' });
    }
    const current = this.#tasks.find((task) => task.id === id);
    if (!current) throw new PrecisionServerError('not-found', 'The task no longer exists.');
    const next = { ...current, done: !current.done };
    this.#tasks = this.#tasks.map((task) => task.id === id ? next : task);
    return { ...next };
  }
}

function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  const error = new Error('Aborted');
  error.name = 'AbortError';
  throw error;
}
