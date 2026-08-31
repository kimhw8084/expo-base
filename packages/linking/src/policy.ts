import type {
  ExternalNavigationAdapter,
  ExternalNavigationPolicy,
  ExternalOpenResult,
  HostRule,
  IncomingLinkDecision,
  IncomingLinkPolicy,
  LinkBlockReason,
  LinkDecision,
  PrecisionLinkingRuntime,
} from './contracts';

const ALWAYS_BLOCKED_SCHEMES = new Set(['javascript', 'data', 'file', 'vbscript', 'blob', 'intent']);
const DEFAULT_MAX_URL_LENGTH = 4096;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

export function normalizeScheme(value: string): string {
  return value.trim().replace(/:$/, '').toLowerCase();
}

export function hostMatches(hostname: string, rule: HostRule): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  const expected = rule.host.trim().toLowerCase().replace(/\.$/, '');
  if (!host || !expected) return false;
  return host === expected || Boolean(rule.allowSubdomains && host.endsWith(`.${expected}`));
}

export function validateExternalUrl(input: string, policy: ExternalNavigationPolicy): LinkDecision {
  const value = input.trim();
  const maxUrlLength = policy.maxUrlLength ?? DEFAULT_MAX_URL_LENGTH;
  if (!value) return blocked('empty');
  if (value.length > maxUrlLength) return blocked('too_long');
  if (CONTROL_CHARACTERS.test(value)) return blocked('invalid_url');

  let parsed: URL;
  try { parsed = new URL(value); } catch { return blocked('invalid_url'); }
  const scheme = normalizeScheme(parsed.protocol);
  const host = parsed.hostname.toLowerCase();
  if (parsed.username || parsed.password) return blocked('embedded_credentials', scheme, host);
  if (!scheme || ALWAYS_BLOCKED_SCHEMES.has(scheme)) return blocked('blocked_scheme', scheme, host);

  if (scheme === 'https' || scheme === 'http') {
    if (scheme === 'https' && policy.allowHttps === false) return blocked('blocked_scheme', scheme, host);
    if (scheme === 'http' && !policy.allowHttp) return blocked('insecure_http', scheme, host);
    if (!host) return blocked('invalid_url', scheme, host);
    const permittedHost = Boolean(policy.allowAnyHttpsHost && scheme === 'https') || (policy.allowedHosts ?? []).some((rule) => hostMatches(host, rule));
    if (!permittedHost) return blocked('blocked_host', scheme, host);
    if (parsed.port && !(policy.allowedPorts ?? []).includes(parsed.port)) return blocked('blocked_port', scheme, host);
    return { allowed: true, normalizedUrl: parsed.toString(), scheme, host };
  }

  if (scheme === 'mailto') return policy.allowMailto ? { allowed: true, normalizedUrl: parsed.toString(), scheme } : blocked('blocked_scheme', scheme);
  if (scheme === 'tel') return policy.allowTel ? { allowed: true, normalizedUrl: parsed.toString(), scheme } : blocked('blocked_scheme', scheme);
  if ((policy.allowedCustomSchemes ?? []).map(normalizeScheme).includes(scheme)) return { allowed: true, normalizedUrl: parsed.toString(), scheme, host };
  return blocked('unsupported_destination', scheme, host);
}

export function resolveIncomingLink(input: string, policy: IncomingLinkPolicy): IncomingLinkDecision {
  const value = input.trim();
  const rejectedRoute = policy.rejectedRoute;
  const maxUrlLength = policy.maxUrlLength ?? DEFAULT_MAX_URL_LENGTH;
  if (!value) return reject(rejectedRoute, 'empty');
  if (value.length > maxUrlLength) return reject(rejectedRoute, 'too_long');
  if (CONTROL_CHARACTERS.test(value)) return reject(rejectedRoute, 'invalid_url');

  if (value.startsWith('/')) {
    const route = normalizeRoute(value);
    return route ? validateIncomingRoute(route, 'internal-path', policy) : reject(rejectedRoute, 'invalid_url');
  }

  let parsed: URL;
  try { parsed = new URL(value); } catch { return reject(rejectedRoute, 'invalid_url'); }
  const scheme = normalizeScheme(parsed.protocol);
  if (ALWAYS_BLOCKED_SCHEMES.has(scheme)) return reject(rejectedRoute, 'blocked_scheme');

  if (policy.appSchemes.map(normalizeScheme).includes(scheme)) {
    const route = routeFromCustomScheme(parsed);
    return route ? validateIncomingRoute(route, 'custom-scheme', policy) : reject(rejectedRoute, 'invalid_url');
  }

  if (scheme === 'https') {
    const host = parsed.hostname.toLowerCase();
    if (!(policy.universalLinkHosts ?? []).some((rule) => hostMatches(host, rule))) return reject(rejectedRoute, 'blocked_host');
    const route = normalizeRoute(`${parsed.pathname}${parsed.search}`);
    return route ? validateIncomingRoute(route, 'universal-link', policy) : reject(rejectedRoute, 'invalid_url');
  }

  if (scheme === 'http') return reject(rejectedRoute, 'insecure_http');
  return reject(rejectedRoute, 'blocked_scheme');
}

export function redactUrlForDiagnostics(input: string): string {
  try {
    const parsed = new URL(input);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return '<invalid-url>';
  }
}

export function createPrecisionLinkingRuntime(options: {
  adapter: ExternalNavigationAdapter;
  externalPolicy: ExternalNavigationPolicy;
  incomingPolicy: IncomingLinkPolicy;
  /** Optional side-effect boundary for already-validated internal routes. Observer failures are ignored. */
  onIncomingRoute?: (route: `/${string}`) => void;
}): PrecisionLinkingRuntime {
  return {
    validateExternal: (url) => validateExternalUrl(url, options.externalPolicy),
    async openExternal(url) {
      const decision = validateExternalUrl(url, options.externalPolicy);
      if (!decision.allowed || !decision.normalizedUrl) return { status: 'blocked', reason: decision.reason ?? 'unsupported_destination' };
      try {
        if (!(await options.adapter.canOpen(decision.normalizedUrl))) return { status: 'unavailable', url: decision.normalizedUrl };
        await options.adapter.open(decision.normalizedUrl);
        return { status: 'opened', url: decision.normalizedUrl };
      } catch (error) {
        return { status: 'failed', url: decision.normalizedUrl, error };
      }
    },
    resolveIncoming: (path) => resolveIncomingLink(path, options.incomingPolicy),
    redirectIncoming(path) {
      const result = resolveIncomingLink(path, options.incomingPolicy);
      if (result.action === 'route' && options.onIncomingRoute) { try { options.onIncomingRoute(result.route); } catch {} }
      return result.route;
    },
  };
}


function validateIncomingRoute(route: `/${string}`, source: 'internal-path' | 'custom-scheme' | 'universal-link', policy: IncomingLinkPolicy): IncomingLinkDecision {
  const parsed = new URL(route, 'https://precision.invalid');
  const rule = (policy.callbackRules ?? []).find((candidate) => candidate.path === parsed.pathname);
  if (!rule) return { action: 'route', route, source };
  const keys = Array.from(parsed.searchParams.keys());
  const allowed = new Set(rule.allowedQueryKeys);
  if (keys.some((key) => !allowed.has(key))) return reject(policy.rejectedRoute, 'invalid_callback');
  const required = rule.requiredQueryKeys ?? [];
  if (required.some((key) => !parsed.searchParams.has(key))) return reject(policy.rejectedRoute, 'invalid_callback');
  return { action: 'route', route, source };
}

function blocked(reason: LinkBlockReason, scheme?: string, host?: string): LinkDecision {
  return { allowed: false, reason, ...(scheme ? { scheme } : {}), ...(host ? { host } : {}) };
}
function reject(route: `/${string}`, reason: LinkBlockReason): IncomingLinkDecision {
  return { action: 'reject', route, reason };
}
function normalizeRoute(value: string): `/${string}` | null {
  if (!value.startsWith('/') || value.startsWith('//') || CONTROL_CHARACTERS.test(value)) return null;
  try {
    const parsed = new URL(value, 'https://precision.invalid');
    if (parsed.origin !== 'https://precision.invalid') return null;
    return `${parsed.pathname}${parsed.search}` as `/${string}`;
  } catch { return null; }
}
function routeFromCustomScheme(parsed: URL): `/${string}` | null {
  const hostSegment = parsed.hostname ? `/${parsed.hostname}` : '';
  const path = parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
  return normalizeRoute(`${hostSegment}${path}${parsed.search}`.replace(/\/{2,}/g, '/'));
}
