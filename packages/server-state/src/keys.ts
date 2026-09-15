export type ExpoBaseQueryValue =
  | string
  | number
  | boolean
  | null
  | readonly ExpoBaseQueryValue[]
  | { readonly [key: string]: ExpoBaseQueryValue };

export type ExpoBaseQueryKey = readonly [namespace: string, ...segments: ExpoBaseQueryValue[]];

export interface ExpoBasePageKeyInput {
  page: number;
  pageSize: number;
  filters?: ExpoBaseQueryValue | undefined;
}

export interface ExpoBaseCursorKeyInput {
  cursor: string | null;
  limit: number;
  filters?: ExpoBaseQueryValue | undefined;
}

/** Typed key helpers keep entity, list, page, and cursor identity consistent. */
export const expoBaseQueryKey = {
  family(namespace: string): ExpoBaseQueryKey {
    return [normalizeNamespace(namespace)];
  },
  entity(namespace: string, id: string | number): ExpoBaseQueryKey {
    return [normalizeNamespace(namespace), 'entity', normalizeExpoBaseQueryValue(id)];
  },
  list(namespace: string, filters: ExpoBaseQueryValue = {}): ExpoBaseQueryKey {
    return [normalizeNamespace(namespace), 'list', normalizeExpoBaseQueryValue(filters)];
  },
  page(namespace: string, input: ExpoBasePageKeyInput): ExpoBaseQueryKey {
    assertPositiveInteger(input.page, 'page');
    assertPositiveInteger(input.pageSize, 'pageSize');
    return [normalizeNamespace(namespace), 'page', normalizeExpoBaseQueryValue({
      filters: input.filters ?? {},
      page: input.page,
      pageSize: input.pageSize,
    })];
  },
  cursor(namespace: string, input: ExpoBaseCursorKeyInput): ExpoBaseQueryKey {
    assertPositiveInteger(input.limit, 'limit');
    return [normalizeNamespace(namespace), 'cursor', normalizeExpoBaseQueryValue({
      cursor: input.cursor,
      filters: input.filters ?? {},
      limit: input.limit,
    })];
  },
  custom(namespace: string, ...segments: readonly ExpoBaseQueryValue[]): ExpoBaseQueryKey {
    return [normalizeNamespace(namespace), ...segments.map(normalizeExpoBaseQueryValue)];
  },
} as const;

export function normalizeExpoBaseQueryKey(key: ExpoBaseQueryKey): ExpoBaseQueryKey {
  if (!Array.isArray(key) || key.length === 0) throw new Error('An Expo Base query key requires a namespace.');
  const [namespace, ...segments] = key;
  return [normalizeNamespace(namespace), ...segments.map(normalizeExpoBaseQueryValue)];
}

export function normalizeExpoBaseQueryValue(value: ExpoBaseQueryValue): ExpoBaseQueryValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Expo Base query keys require finite numbers.');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map((entry) => normalizeExpoBaseQueryValue(entry));
  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('Expo Base query keys accept only serializable plain objects.');
    const normalized: Record<string, ExpoBaseQueryValue> = {};
    for (const key of Object.keys(value).sort()) {
      const entry = (value as Readonly<Record<string, ExpoBaseQueryValue>>)[key];
      if (entry === undefined) throw new Error(`Expo Base query key property "${key}" cannot be undefined.`);
      normalized[key] = normalizeExpoBaseQueryValue(entry);
    }
    return normalized;
  }
  throw new Error('Expo Base query keys must be serializable.');
}

function normalizeNamespace(namespace: string): string {
  const value = namespace.trim();
  if (!/^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)*$/.test(value) || value.length > 128) {
    throw new Error(`Invalid Expo Base query namespace: ${namespace}`);
  }
  return value;
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive safe integer.`);
}
