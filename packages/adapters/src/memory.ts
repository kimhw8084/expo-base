import type { AnalyticsAdapter, AnalyticsEvent, AppServices, AuthAdapter, AuthListener, AuthSession, AuthorizationAdapter, AuthorizationListener, EntityRecord, EntityStoreAdapter, ImageProvider, ImageRequest, KeyValueStorageAdapter } from './contracts';

export class MemoryAuthAdapter implements AuthAdapter {
  #session: AuthSession | null;
  #listeners = new Set<AuthListener>();
  constructor(initialSession: AuthSession | null = null) { this.#session = initialSession; }
  async getSession() { return this.#session; }
  async signIn({ email }: { email: string; password: string }) {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) throw new Error('A valid email address is required.');
    this.#session = { user: { id: `demo:${normalized}`, email: normalized, displayName: normalized.split('@')[0] || 'Demo user' } };
    this.#emit();
    return this.#session;
  }
  async signOut() { this.#session = null; this.#emit(); }
  subscribe(listener: AuthListener) { this.#listeners.add(listener); listener(this.#session); return () => this.#listeners.delete(listener); }
  #emit() { for (const listener of this.#listeners) listener(this.#session); }
}


export class MemoryAuthorizationAdapter implements AuthorizationAdapter {
  #capabilities = new Map<string, readonly string[]>();
  #listeners = new Map<string, Set<AuthorizationListener>>();
  constructor(initial: Readonly<Record<string, readonly string[]>> = {}) { for (const [userId, values] of Object.entries(initial)) this.#capabilities.set(userId, [...values]); }
  async getCapabilities(userId: string) { return this.#capabilities.get(userId) ?? []; }
  subscribe(userId: string, listener: AuthorizationListener) {
    const set = this.#listeners.get(userId) ?? new Set<AuthorizationListener>(); set.add(listener); this.#listeners.set(userId, set);
    listener(this.#capabilities.get(userId) ?? []);
    return () => { set.delete(listener); if (!set.size) this.#listeners.delete(userId); };
  }
  setCapabilities(userId: string, capabilities: readonly string[]) {
    this.#capabilities.set(userId, [...capabilities]);
    for (const listener of this.#listeners.get(userId) ?? []) listener(this.#capabilities.get(userId) ?? []);
  }
}

export class MemoryEntityStore<T extends EntityRecord> implements EntityStoreAdapter<T> {
  #records = new Map<string, T>();
  constructor(initial: readonly T[] = []) { for (const item of initial) this.#records.set(item.id, item); }
  async list() { return Array.from(this.#records.values()); }
  async get(id: string) { return this.#records.get(id) ?? null; }
  async upsert(value: T) { this.#records.set(value.id, value); return value; }
  async remove(id: string) { this.#records.delete(id); }
}

export class MemoryKeyValueStorage implements KeyValueStorageAdapter {
  #values = new Map<string, string>();
  async get(key: string) { return this.#values.get(key) ?? null; }
  async set(key: string, value: string) { this.#values.set(key, value); }
  async remove(key: string) { this.#values.delete(key); }
}

export class RecordingAnalyticsAdapter implements AnalyticsAdapter {
  identifiedUser: string | null = null;
  readonly events: AnalyticsEvent[] = [];
  identify(userId: string | null) { this.identifiedUser = userId; }
  track(event: AnalyticsEvent) { this.events.push({ name: event.name, properties: event.properties ? { ...event.properties } : undefined }); }
}

export class NoopAnalyticsAdapter implements AnalyticsAdapter {
  identify(_userId: string | null) {}
  track(_event: AnalyticsEvent) {}
}

export class PassthroughImageProvider implements ImageProvider {
  resolve(request: ImageRequest) { return request.source; }
}

export function createDemoServices(): AppServices {
  return { auth: new MemoryAuthAdapter(), authorization: new MemoryAuthorizationAdapter(), storage: new MemoryKeyValueStorage(), analytics: new NoopAnalyticsAdapter(), images: new PassthroughImageProvider() };
}
