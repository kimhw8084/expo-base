import type { BreakpointName } from '@precision-calm/tokens';

export const certificationBreakpoints = { compact: 0, medium: 600, expanded: 900, wide: 1200 } as const;

export type CertificationTheme = 'light' | 'dark';
export type CertificationDensity = 'comfortable' | 'compact';
export type ContentStress = 'normal' | 'long-text' | 'large-number' | 'empty' | 'loading' | 'error' | 'offline';

export interface CertificationViewport {
  id: string;
  width: number;
  height: number;
  deviceClass: 'phone' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
}

export const certificationViewports: readonly CertificationViewport[] = [
  { id: 'phone-320x568', width: 320, height: 568, deviceClass: 'phone', orientation: 'portrait' },
  { id: 'phone-375x812', width: 375, height: 812, deviceClass: 'phone', orientation: 'portrait' },
  { id: 'phone-390x844', width: 390, height: 844, deviceClass: 'phone', orientation: 'portrait' },
  { id: 'phone-430x932', width: 430, height: 932, deviceClass: 'phone', orientation: 'portrait' },
  { id: 'tablet-768x1024', width: 768, height: 1024, deviceClass: 'tablet', orientation: 'portrait' },
  { id: 'tablet-1024x768', width: 1024, height: 768, deviceClass: 'tablet', orientation: 'landscape' },
  { id: 'desktop-1280x800', width: 1280, height: 800, deviceClass: 'desktop', orientation: 'landscape' },
  { id: 'desktop-1440x900', width: 1440, height: 900, deviceClass: 'desktop', orientation: 'landscape' },
  { id: 'desktop-1920x1080', width: 1920, height: 1080, deviceClass: 'desktop', orientation: 'landscape' },
] as const;

export const certificationThemes: readonly CertificationTheme[] = ['light', 'dark'] as const;
export const certificationDensities: readonly CertificationDensity[] = ['comfortable', 'compact'] as const;
export const contentStressCases: readonly ContentStress[] = ['normal', 'long-text', 'large-number', 'empty', 'loading', 'error', 'offline'] as const;

export interface CertificationScenario {
  id: string;
  viewport: CertificationViewport;
  theme: CertificationTheme;
  density: CertificationDensity;
  content: ContentStress;
  capability: BreakpointName;
}

export function capabilityForWidth(width: number): BreakpointName {
  if (!Number.isFinite(width) || width < 0) throw new Error('Viewport width must be a finite non-negative number.');
  if (width >= certificationBreakpoints.wide) return 'wide';
  if (width >= certificationBreakpoints.expanded) return 'expanded';
  if (width >= certificationBreakpoints.medium) return 'medium';
  return 'compact';
}

export function createCertificationScenarios(): readonly CertificationScenario[] {
  const scenarios: CertificationScenario[] = [];
  for (const viewport of certificationViewports) {
    for (const theme of certificationThemes) {
      for (const density of certificationDensities) {
        for (const content of contentStressCases) {
          scenarios.push({
            id: `${viewport.id}__${theme}__${density}__${content}`,
            viewport,
            theme,
            density,
            content,
            capability: capabilityForWidth(viewport.width),
          });
        }
      }
    }
  }
  return scenarios;
}

export interface GeometryRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GeometryElement extends GeometryRect {
  id: string;
  actionable?: boolean;
  allowViewportOverflow?: boolean;
  overlapGroup?: string;
}

export interface GeometrySnapshot {
  viewportWidth: number;
  viewportHeight: number;
  documentWidth: number;
  elements: readonly GeometryElement[];
}

export interface GeometryViolation {
  code: 'invalid-geometry' | 'page-overflow-x' | 'offscreen-action' | 'target-too-small' | 'exclusive-overlap';
  elementId?: string;
  relatedElementId?: string;
  message: string;
}

const MIN_ACTION_TARGET = 44;

function finiteRect(rect: GeometryRect): boolean {
  return [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) && rect.width >= 0 && rect.height >= 0;
}

function intersects(a: GeometryRect, b: GeometryRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function validateGeometrySnapshot(snapshot: GeometrySnapshot): readonly GeometryViolation[] {
  const violations: GeometryViolation[] = [];
  if (!Number.isFinite(snapshot.viewportWidth) || !Number.isFinite(snapshot.viewportHeight) || snapshot.viewportWidth <= 0 || snapshot.viewportHeight <= 0 || !Number.isFinite(snapshot.documentWidth)) {
    return [{ code: 'invalid-geometry', message: 'Snapshot dimensions must be finite and positive.' }];
  }
  if (snapshot.documentWidth > snapshot.viewportWidth + 1) {
    violations.push({ code: 'page-overflow-x', message: `Document width ${snapshot.documentWidth} exceeds viewport width ${snapshot.viewportWidth}.` });
  }
  for (const element of snapshot.elements) {
    if (!finiteRect(element)) {
      violations.push({ code: 'invalid-geometry', elementId: element.id, message: `${element.id} has invalid geometry.` });
      continue;
    }
    if (element.actionable) {
      if (!element.allowViewportOverflow && (element.x < -1 || element.x + element.width > snapshot.viewportWidth + 1 || element.y < -1)) {
        violations.push({ code: 'offscreen-action', elementId: element.id, message: `${element.id} is not fully reachable in the viewport.` });
      }
      if (element.width < MIN_ACTION_TARGET || element.height < MIN_ACTION_TARGET) {
        violations.push({ code: 'target-too-small', elementId: element.id, message: `${element.id} is smaller than the ${MIN_ACTION_TARGET}px minimum target.` });
      }
    }
  }
  for (let index = 0; index < snapshot.elements.length; index += 1) {
    const a = snapshot.elements[index];
    if (!a?.overlapGroup) continue;
    for (let otherIndex = index + 1; otherIndex < snapshot.elements.length; otherIndex += 1) {
      const b = snapshot.elements[otherIndex];
      if (!b || b.overlapGroup !== a.overlapGroup) continue;
      if (intersects(a, b)) {
        violations.push({ code: 'exclusive-overlap', elementId: a.id, relatedElementId: b.id, message: `${a.id} overlaps ${b.id} inside exclusive group ${a.overlapGroup}.` });
      }
    }
  }
  return violations;
}
