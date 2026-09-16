import { useOptionalExpoBaseCapability, useExpoBaseCapability } from '@expo-base/capabilities';

export const expoBaseObservabilityCapability = 'observability';
export type ExpoBaseObservabilityLevel = 'debug' | 'info' | 'warn' | 'error';
export type ExpoBaseObservabilityAttributes = Readonly<Record<string, string | number | boolean | null>>;
export interface ExpoBaseObservabilityEvent { name: string; attributes?: ExpoBaseObservabilityAttributes | undefined; }

/** Provider-neutral boundary. Callers must omit secrets and direct identifiers. */
export interface ExpoBaseObservability {
  log(level: ExpoBaseObservabilityLevel, event: ExpoBaseObservabilityEvent): void | Promise<void>;
  report(error: unknown, context?: ExpoBaseObservabilityEvent | undefined): void | Promise<void>;
  track?(event: ExpoBaseObservabilityEvent): void | Promise<void>;
  measure?<T>(event: ExpoBaseObservabilityEvent, operation: () => T | Promise<T>): Promise<T>;
}

/** Safe default for tests and apps that have not selected a vendor integration. */
export class NoopObservability implements ExpoBaseObservability {
  log(_level: ExpoBaseObservabilityLevel, _event: ExpoBaseObservabilityEvent): void {}
  report(_error: unknown, _context?: ExpoBaseObservabilityEvent): void {}
  track(_event: ExpoBaseObservabilityEvent): void {}
  async measure<T>(_event: ExpoBaseObservabilityEvent, operation: () => T | Promise<T>): Promise<T> { return operation(); }
}

export class RecordingObservability implements ExpoBaseObservability {
  readonly logs: Array<{ level: ExpoBaseObservabilityLevel; event: ExpoBaseObservabilityEvent }> = [];
  readonly reports: Array<{ error: unknown; context?: ExpoBaseObservabilityEvent | undefined }> = [];
  readonly events: ExpoBaseObservabilityEvent[] = [];
  log(level: ExpoBaseObservabilityLevel, event: ExpoBaseObservabilityEvent): void { this.logs.push({ level, event: cloneEvent(event) }); }
  report(error: unknown, context?: ExpoBaseObservabilityEvent): void { this.reports.push({ error, ...(context ? { context: cloneEvent(context) } : {}) }); }
  track(event: ExpoBaseObservabilityEvent): void { this.events.push(cloneEvent(event)); }
  async measure<T>(event: ExpoBaseObservabilityEvent, operation: () => T | Promise<T>): Promise<T> { try { return await operation(); } finally { this.track(event); } }
}

export function useExpoBaseObservability(): ExpoBaseObservability { return useExpoBaseCapability<ExpoBaseObservability>(expoBaseObservabilityCapability); }
export function useOptionalExpoBaseObservability(): ExpoBaseObservability | null { return useOptionalExpoBaseCapability<ExpoBaseObservability>(expoBaseObservabilityCapability); }

function cloneEvent(event: ExpoBaseObservabilityEvent): ExpoBaseObservabilityEvent { return { name: event.name, ...(event.attributes ? { attributes: { ...event.attributes } } : {}) }; }
