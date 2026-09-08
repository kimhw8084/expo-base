export interface OwnerFixtureDefinition {
  ownerId: string;
  fixtureId: string;
  route: '/state-workbench';
  testID: string;
  states: readonly string[];
}

/** Typed fixture index used by the workbench and by executable owner certification. */
export const ownerFixtures = [
  { ownerId: 'components.actions', fixtureId: 'owner-workbench-components.actions', route: '/state-workbench', testID: 'owner-workbench-components.actions', states: ['enabled', 'hover', 'focus-visible', 'pressed', 'disabled', 'loading', 'destructive', 'long-content'] },
  { ownerId: 'components.identity', fixtureId: 'owner-workbench-components.identity', route: '/state-workbench', testID: 'owner-workbench-components.identity', states: ['image', 'initials', 'loading', 'error', 'decorative', 'long-content'] },
  { ownerId: 'components.disclosure', fixtureId: 'owner-workbench-components.disclosure', route: '/state-workbench', testID: 'owner-workbench-components.disclosure', states: ['collapsed', 'expanded', 'focus-visible', 'disabled', 'long-content', 'reduced-motion'] },
  { ownerId: 'forms.text-entry', fixtureId: 'owner-workbench-forms.text-entry', route: '/state-workbench', testID: 'owner-workbench-forms.text-entry', states: ['enabled', 'focus-visible', 'disabled', 'read-only', 'error', 'loading', 'long-content'] },
  { ownerId: 'forms.static-choice', fixtureId: 'owner-workbench-forms.static-choice', route: '/state-workbench', testID: 'owner-workbench-forms.static-choice', states: ['enabled', 'focus-visible', 'selected', 'disabled', 'error', 'long-content'] },
  { ownerId: 'forms.semantic-input', fixtureId: 'owner-workbench-forms.semantic-input', route: '/state-workbench', testID: 'owner-workbench-forms.semantic-input', states: ['enabled', 'focus-visible', 'disabled', 'read-only', 'error', 'locale-format', 'long-content'] },
  { ownerId: 'forms.searchable-choice', fixtureId: 'owner-workbench-forms.searchable-choice', route: '/state-workbench', testID: 'owner-workbench-forms.searchable-choice', states: ['closed', 'open', 'search', 'active-option', 'selected', 'loading', 'empty', 'long-content'] },
  { ownerId: 'forms.code-entry', fixtureId: 'owner-workbench-forms.code-entry', route: '/state-workbench', testID: 'owner-workbench-forms.code-entry', states: ['empty', 'partial', 'complete', 'paste', 'backspace', 'error', 'disabled', 'long-content'] },
  { ownerId: 'overlays.dialog-alert', fixtureId: 'owner-workbench-overlays.dialog-alert', route: '/state-workbench', testID: 'owner-workbench-overlays.dialog-alert', states: ['open', 'focus-visible', 'loading', 'destructive', 'long-content', 'reduced-motion'] },
  { ownerId: 'overlays.sheet', fixtureId: 'owner-workbench-overlays.sheet', route: '/state-workbench', testID: 'owner-workbench-overlays.sheet', states: ['open', 'focus-visible', 'long-content', 'scrolling', 'reduced-motion'] },
  { ownerId: 'overlays.menu', fixtureId: 'owner-workbench-overlays.menu', route: '/state-workbench', testID: 'owner-workbench-overlays.menu', states: ['collapsed', 'expanded', 'focus-visible', 'selected', 'disabled', 'destructive', 'long-content'] },
  { ownerId: 'feedback.async', fixtureId: 'owner-workbench-feedback.async', route: '/state-workbench', testID: 'owner-workbench-feedback.async', states: ['loading', 'error', 'empty', 'success', 'offline', 'stale', 'retry', 'long-content'] },
  { ownerId: 'data.table', fixtureId: 'owner-workbench-data.table', route: '/state-workbench', testID: 'owner-workbench-data.table', states: ['enabled', 'focus-visible', 'selected', 'mixed', 'loading', 'empty', 'error', 'long-content'] },
  { ownerId: 'data.metric', fixtureId: 'owner-workbench-data.metric', route: '/state-workbench', testID: 'owner-workbench-data.metric', states: ['ready', 'loading', 'long-content', 'compact'] },
  { ownerId: 'data.timeline', fixtureId: 'owner-workbench-data.timeline', route: '/state-workbench', testID: 'owner-workbench-data.timeline', states: ['ready', 'empty', 'long-content', 'compact'] },
  { ownerId: 'media.frame', fixtureId: 'owner-workbench-media.frame', route: '/state-workbench', testID: 'owner-workbench-media.frame', states: ['loading', 'success', 'error', 'empty', 'long-content'] },
  { ownerId: 'visualization.frame', fixtureId: 'owner-workbench-visualization.frame', route: '/state-workbench', testID: 'owner-workbench-visualization.frame', states: ['ready', 'loading', 'refreshing', 'stale', 'empty', 'error', 'long-content', 'reduced-motion'] },
  { ownerId: 'visualization.single-series', fixtureId: 'owner-workbench-visualization.single-series', route: '/state-workbench', testID: 'owner-workbench-visualization.single-series', states: ['ready', 'loading', 'empty', 'error', 'selected', 'long-content', 'reduced-motion'] },
  { ownerId: 'visualization.composition', fixtureId: 'owner-workbench-visualization.composition', route: '/state-workbench', testID: 'owner-workbench-visualization.composition', states: ['ready', 'loading', 'empty', 'error', 'selected', 'legend', 'data-table', 'long-content'] },
  { ownerId: 'visualization.multi-series', fixtureId: 'owner-workbench-visualization.multi-series', route: '/state-workbench', testID: 'owner-workbench-visualization.multi-series', states: ['ready', 'loading', 'empty', 'error', 'selected', 'legend', 'data-table', 'long-content'] },
  { ownerId: 'visualization.advanced', fixtureId: 'owner-workbench-visualization.advanced', route: '/state-workbench', testID: 'owner-workbench-visualization.advanced', states: ['ready', 'loading', 'empty', 'error', 'selected', 'long-content'] },
] as const satisfies readonly OwnerFixtureDefinition[];
