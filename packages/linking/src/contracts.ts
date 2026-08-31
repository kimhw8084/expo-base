export type LinkBlockReason =
  | 'empty'
  | 'too_long'
  | 'invalid_url'
  | 'blocked_scheme'
  | 'insecure_http'
  | 'blocked_host'
  | 'blocked_port'
  | 'unsupported_destination'
  | 'embedded_credentials'
  | 'invalid_callback';

export interface HostRule {
  /** ASCII hostname, compared case-insensitively. */
  host: string;
  /** Allows sub.example.com but never lookalikeexample.com. */
  allowSubdomains?: boolean;
}

export interface ExternalNavigationPolicy {
  /** HTTPS is still host-gated; true does not mean arbitrary hosts are trusted. */
  allowHttps?: boolean;
  /** HTTP remains off by default and should normally be limited to local development. */
  allowHttp?: boolean;
  allowMailto?: boolean;
  allowTel?: boolean;
  /** Explicit non-web schemes such as maps or a partner application. */
  allowedCustomSchemes?: readonly string[];
  /** Empty means no web hosts are approved unless allowAnyHttpsHost is explicitly enabled. */
  allowedHosts?: readonly HostRule[];
  allowAnyHttpsHost?: boolean;
  /** Non-default ports are blocked unless explicitly listed. */
  allowedPorts?: readonly string[];
  maxUrlLength?: number;
}

export interface IncomingCallbackRule {
  path: `/${string}`;
  allowedQueryKeys: readonly string[];
  requiredQueryKeys?: readonly string[];
}

export interface IncomingLinkPolicy {
  appSchemes: readonly string[];
  universalLinkHosts?: readonly HostRule[];
  /** Sensitive callback paths can enforce exact query contracts. */
  callbackRules?: readonly IncomingCallbackRule[];
  /** Route returned when input is malformed, hostile, or from an untrusted origin. */
  rejectedRoute: `/${string}`;
  maxUrlLength?: number;
}

export interface LinkDecision {
  allowed: boolean;
  normalizedUrl?: string;
  scheme?: string;
  host?: string;
  reason?: LinkBlockReason;
}

export type IncomingLinkDecision =
  | { action: 'route'; route: `/${string}`; source: 'internal-path' | 'custom-scheme' | 'universal-link' }
  | { action: 'reject'; route: `/${string}`; reason: LinkBlockReason };

export interface ExternalNavigationAdapter {
  canOpen(url: string): Promise<boolean>;
  open(url: string): Promise<void>;
}

export type ExternalOpenResult =
  | { status: 'opened'; url: string }
  | { status: 'blocked'; reason: LinkBlockReason }
  | { status: 'unavailable'; url: string }
  | { status: 'failed'; url: string; error: unknown };

export interface PrecisionLinkingRuntime {
  validateExternal(url: string): LinkDecision;
  openExternal(url: string): Promise<ExternalOpenResult>;
  resolveIncoming(path: string, options?: { initial?: boolean }): IncomingLinkDecision;
  redirectIncoming(path: string, options?: { initial?: boolean }): `/${string}`;
}
