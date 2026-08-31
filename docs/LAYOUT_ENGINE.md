# Adaptive layout engine — Gate 02/03

## Invariants

1. Feature code does not measure the viewport. Responsive behavior is expressed through layout components and capability ranges.
2. Feature code does not own primary scroll geometry. Screens use `Screen`, `ScrollScreen`, and later list/form screen primitives.
3. Normal page structure never depends on absolute positioning or manual z-index.
4. `minWidth: 0` is provided by system primitives where flex shrink/wrap is expected.
5. Compact, medium, expanded, and wide are capability regimes, not device names.
6. Native breakpoints use points so the same capability vocabulary maps to logical UI size instead of raw device pixels.
7. Master/detail and sidebar patterns may change composition rather than merely shrink.
8. Action bars use measured width and semantic priority; lower-priority actions collapse before higher-priority actions.
9. A required-action capacity failure is surfaced explicitly and falls back to wrapping rather than clipping.
10. One primary vertical scroll owner is the default contract.

## Priority action behavior

`required` actions are preserved as direct actions. `preferred` actions are considered next. `overflow` actions are only displayed directly after all preferred actions fit. If any item is hidden, the overflow trigger budget is reserved before accepting another visible action.

The initial measurement pass reserves action-bar height and keeps the visible rail transparent until widths are known. This avoids rendering a briefly wrapped/overlapping action set and then popping it into a different structure.

## Responsive composition

- `ResponsiveSlot` performs structural show/hide without feature-level viewport hooks.
- `AdaptiveSplit` stacks on compact/medium and becomes a split workspace on expanded/wide.
- `SidebarLayout` hides the persistent sidebar below expanded capability and accepts a compact header replacement.
- `MasterDetail` shows one primary workflow on compact by default, and concurrent master/detail panes on expanded/wide.
- `Page`, `Section`, and `PageHeader` own page rhythm and header reflow.

## Static enforcement

All app workspaces are scanned. Feature code is rejected for raw viewport measurement, direct platform branching, raw ScrollView/FlatList/SectionList composition, direct icon-library imports, literal geometry/colors, and direct SVG icon usage.
