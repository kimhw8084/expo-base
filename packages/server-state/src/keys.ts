export type PrecisionQueryValue =
  | string
  | number
  | boolean
  | null
  | readonly PrecisionQueryValue[]
  | { readonly [key: string]: PrecisionQueryValue };

export type PrecisionQueryKey = readonly [namespace: string, ...segments: PrecisionQueryValue[]];

export interface PrecisionPageKeyInput {
  page: number;
  pageSize: number;
  filters?: PrecisionQueryValue | undefined;
}

export interface PrecisionCursorKeyInput {
  cursor: string | null;
  limit: number;
  filters?: PrecisionQueryValue | undefined;
}

/** Typed key helpers keep entity, list, page, and cursor identity consistent. */
export const precisionQueryKey = {
  family(namespace: string): PrecisionQueryKey {
    return [normalizeNamespace(namespace)];
  },
  entity(namespace: string, id: string | number): PrecisionQueryKey {
    return [normalizeNamespace(namespace), 'entity', normalizePrecisionQueryValue(id)];
  },
  list(namespace: string, filters: PrecisionQueryValue = {}): PrecisionQueryKey {
    return [normalizeNamespace(namespace), 'list', normalizePrecisionQueryValue(filters)];
  },
  page(namespace: string, input: PrecisionPageKeyInput): PrecisionQueryKey {
    assertPositiveInteger(input.page, 'page');
    assertPositiveInteger(input.pageSize, 'pageSize');
    return [normalizeNamespace(namespace), 'page', normalizePrecisionQueryValue({
      filters: input.filters ?? {},
      page: input.page,
      pageSize: input.pageSize,
    })];
  },
  cursor(namespace: string, input: PrecisionCursorKeyInput): PrecisionQueryKey {
    assertPositiveInteger(input.limit, 'limit');
    return [normalizeNamespace(namespace), 'cursor', normalizePrecisionQueryValue({
      cursor: input.cursor,
      filters: input.filters ?? {},
      limit: input.limit,
    })];
  },
  custom(namespace: string, ...segments: readonly PrecisionQueryValue[]): PrecisionQueryKey {
    return [normalizeNamespace(namespace), ...segments.map(normalizePrecisionQueryValue)];
  },
} as const;

export function normalizePrecisionQueryKey(key: PrecisionQueryKey): PrecisionQueryKey {
  if (!Array.isArray(key) || key.length === 0) throw new Error('A Precision query key requires a namespace.');
  const [namespace, ...segments] = key;
  return [normalizeNamespace(namespace), ...segments.map(normalizePrecisionQueryValue)];
}

export function normalizePrecisionQueryValue(value: PrecisionQueryValue): PrecisionQueryValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Precision query keys require finite numbers.');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map((entry) => normalizePrecisionQueryValue(entry));
  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('Precision query keys accept only serializable plain objects.');
    const normalized: Record<string, PrecisionQueryValue> = {};
    for (const key of Object.keys(value).sort()) {
      const entry = (value as Readonly<Record<string, PrecisionQueryValue>>)[key];
      if (entry === undefined) throw new Error(`Precision query key property "${key}" cannot be undefined.`);
      normalized[key] = normalizePrecisionQueryValue(entry);
    }
    return normalized;
  }
  throw new Error('Precision query keys must be serializable.');
}

function normalizeNamespace(namespace: string): string {
  const value = namespace.trim();
  if (!/^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)*$/.test(value) || value.length > 128) {
    throw new Error(`Invalid Precision query namespace: ${namespace}`);
  }
  return value;
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive safe integer.`);
}
