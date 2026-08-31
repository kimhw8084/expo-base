export interface AuthUser { id: string; email?: string | undefined; displayName?: string | undefined; }
export interface AuthSession { user: AuthUser; accessToken?: string | undefined; expiresAt?: number | undefined; }
export type AuthListener = (session: AuthSession | null) => void;
export interface AuthAdapter {
  getSession(): Promise<AuthSession | null>;
  signIn(input: { email: string; password: string }): Promise<AuthSession>;
  signOut(): Promise<void>;
  subscribe(listener: AuthListener): () => void;
}


export type AuthorizationListener = (capabilities: readonly string[]) => void;
export interface AuthorizationAdapter {
  getCapabilities(userId: string): Promise<readonly string[]>;
  /** Optional live updates for remote policy/plan changes. */
  subscribe?(userId: string, listener: AuthorizationListener): () => void;
}

export interface EntityRecord { id: string; }
export interface EntityStoreAdapter<T extends EntityRecord> {
  list(): Promise<readonly T[]>;
  get(id: string): Promise<T | null>;
  upsert(value: T): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface KeyValueStorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface AnalyticsEvent { name: string; properties?: Readonly<Record<string, string | number | boolean | null>> | undefined; }
export interface AnalyticsAdapter {
  identify(userId: string | null): Promise<void> | void;
  track(event: AnalyticsEvent): Promise<void> | void;
}

export interface ImageRequest { source: string; width?: number | undefined; height?: number | undefined; }
export interface ImageProvider { resolve(request: ImageRequest): string; }

export interface AppServices {
  auth: AuthAdapter;
  authorization: AuthorizationAdapter;
  storage: KeyValueStorageAdapter;
  analytics: AnalyticsAdapter;
  images: ImageProvider;
}
