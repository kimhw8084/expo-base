import { useOptionalPrecisionCapability, usePrecisionCapability } from '@precision-calm/capabilities';

export const precisionObservabilityCapability = 'observability';
export type PrecisionObservabilityLevel = 'debug' | 'info' | 'warn' | 'error';
export type PrecisionObservabilityAttributes = Readonly<Record<string, string | number | boolean | null>>;
export interface PrecisionObservabilityEvent { name: string; attributes?: PrecisionObservabilityAttributes | undefined; }

/** Provider-neutral boundary. Callers must omit secrets and direct identifiers. */
export interface PrecisionObservability {
  log(level: PrecisionObservabilityLevel, event: PrecisionObservabilityEvent): void | Promise<void>;
  report(error: unknown, context?: PrecisionObservabilityEvent | undefined): void | Promise<void>;
  track?(event: PrecisionObservabilityEvent): void | Promise<void>;
  measure?<T>(event: PrecisionObservabilityEvent, operation: () => T | Promise<T>): Promise<T>;
}

/** Safe default for tests and apps that have not selected a vendor integration. */
export class NoopObservability implements PrecisionObservability {
  log(_level: PrecisionObservabilityLevel, _event: PrecisionObservabilityEvent): void {}
  report(_error: unknown, _context?: PrecisionObservabilityEvent): void {}
  track(_event: PrecisionObservabilityEvent): void {}
  async measure<T>(_event: PrecisionObservabilityEvent, operation: () => T | Promise<T>): Promise<T> { return operation(); }
}

export class RecordingObservability implements PrecisionObservability {
  readonly logs: Array<{ level: PrecisionObservabilityLevel; event: PrecisionObservabilityEvent }> = [];
  readonly reports: Array<{ error: unknown; context?: PrecisionObservabilityEvent | undefined }> = [];
  readonly events: PrecisionObservabilityEvent[] = [];
  log(level: PrecisionObservabilityLevel, event: PrecisionObservabilityEvent): void { this.logs.push({ level, event: cloneEvent(event) }); }
  report(error: unknown, context?: PrecisionObservabilityEvent): void { this.reports.push({ error, ...(context ? { context: cloneEvent(context) } : {}) }); }
  track(event: PrecisionObservabilityEvent): void { this.events.push(cloneEvent(event)); }
  async measure<T>(event: PrecisionObservabilityEvent, operation: () => T | Promise<T>): Promise<T> { try { return await operation(); } finally { this.track(event); } }
}

export function usePrecisionObservability(): PrecisionObservability { return usePrecisionCapability<PrecisionObservability>(precisionObservabilityCapability); }
export function useOptionalPrecisionObservability(): PrecisionObservability | null { return useOptionalPrecisionCapability<PrecisionObservability>(precisionObservabilityCapability); }

function cloneEvent(event: PrecisionObservabilityEvent): PrecisionObservabilityEvent { return { name: event.name, ...(event.attributes ? { attributes: { ...event.attributes } } : {}) }; }
