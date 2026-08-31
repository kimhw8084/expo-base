export interface NavigationContractItem {
  key: string;
  label: string;
  href?: string;
}

export interface NavigationContractResult {
  valid: boolean;
  violations: string[];
}

export function validatePrimaryNavigation(items: readonly NavigationContractItem[]): NavigationContractResult {
  const violations: string[] = [];
  if (items.length < 3) violations.push('Primary navigation should contain at least 3 destinations.');
  if (items.length > 5) violations.push('Primary compact navigation may contain at most 5 destinations.');
  const keys = new Set<string>();
  for (const item of items) {
    if (!item.key.trim()) violations.push('Navigation keys must be non-empty.');
    if (!item.label.trim()) violations.push(`Navigation item "${item.key}" must have a visible label.`);
    if (keys.has(item.key)) violations.push(`Duplicate navigation key: ${item.key}`);
    keys.add(item.key);
  }
  return { valid: violations.length === 0, violations };
}

export function bestNavigationMatch(pathname: string, items: readonly NavigationContractItem[]): string | null {
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const candidates = items
    .filter((item) => item.href)
    .map((item) => ({ ...item, normalizedHref: item.href === '/' ? '/' : item.href!.replace(/\/+$/, '') }))
    .filter((item) => normalizedPath === item.normalizedHref || (item.normalizedHref !== '/' && normalizedPath.startsWith(`${item.normalizedHref}/`)))
    .sort((a, b) => b.normalizedHref.length - a.normalizedHref.length);
  return candidates[0]?.key ?? null;
}
