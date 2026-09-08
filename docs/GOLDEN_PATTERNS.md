# Golden page patterns

The golden-layout gate moves Precision Calm from a component kit to a reusable application platform.

The original page-layout catalog contains 15 core layouts:

1. Dashboard
2. Feed/list
3. Search results
4. Data workspace
5. Detail
6. Master/detail
7. Create/edit form
8. Wizard
9. Settings
10. Profile
11. Authentication
12. Analytics
13. Empty start
14. Full-screen workflow
15. Overlay workflow

The authoritative workflow taxonomy is [`golden.patterns.json`](../golden.patterns.json), with the intent-first guide in [Golden workflows](./GOLDEN_WORKFLOWS.md). It extends these core layouts with form, review, import, completion, permission, offline, and command-launcher workflows without multiplying one-off page templates.

Each pattern is a composition contract built from existing adaptive layout primitives rather than a fixed screenshot. Feature products provide semantic slots—metrics, content, filters, actions, details, form fields—and the pattern owns content width, composition and compact-to-expanded transformation.

The reference app includes a pattern playground that cycles through all 15 using synthetic content. These patterns are recommended starting points, not a prohibition against lower-level layout primitives for genuinely unique workflows.

## Surface hierarchy

Patterns use semantic card hierarchy rather than treating every rectangle as visually equal:

- `surface` is the default bordered workspace/content surface.
- `subtle` is lower-emphasis context such as inspectors, secondary information, and zero-data framing.
- `elevated` is reserved for prominent tasks such as authentication or a dominant primary workspace.

Generated applications demonstrate the same hierarchy so product teams begin with deliberate depth instead of inventing local shadows or background colors.

Page-header action regions own the full compact width. Actions that should stack edge-to-edge opt into the shared `responsiveWidth="compact-full"` button behavior and return to intrinsic sizing at larger breakpoints.

For long or keyboard-driven workflows, `FormWorkspaceLayout` composes `FormScreen`, `StickyActionBar`, and `FormActions`. Do not add a route-local fixed footer: the shared owner preserves safe areas, keyboard behavior, compact full-width actions, and desktop action order.

## Dashboard information hierarchy

Dashboard sections should pair `SectionHeader` with semantic `Card` variants: elevated surfaces for primary work, default surfaces for peer content, and subtle surfaces for supporting context. Page-level badges belong in `PageHeader.metadata` rather than in feature-owned header rows.

## Dense workspace pattern

A production data workspace composes `SectionHeader` → `DataToolbar` → `AdaptiveDataTable` → conditional `SelectionBar` → `Pagination`. Sorting is applied to the filtered dataset before pagination. Bulk-selection state is explicit and controlled, and destructive actions remain visually distinct. Dashboard summaries use `MetricGroup` rather than hand-built metric cards so wrapping, density, and numeric hierarchy stay system-owned.
