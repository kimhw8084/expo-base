# Data and content system

Gate 09 establishes the product-neutral primitives used for dense operational and financial information.

## Contracts

- `Metric` and `MetricGroup` provide numeric hierarchy without forcing every metric into a decorative card.
- `KeyValueList` provides labeled detail data with safe wrapping.
- `ListRow` provides a dense, interactive content row with system-owned geometry and interaction states.
- `AdaptiveDataTable` does **not** squeeze a desktop table into a phone. Compact/medium capability regimes render structured records; expanded/wide regimes render a columnar view.
- `Pagination` uses the shared pure pagination-window solver. `CursorPagination` and
  `InfinitePagination` expose backend-neutral cursor/infinite controls without assuming REST.
- Currency, percent, and compact-number formatting live in `@precision-calm/platform`; feature screens do not instantiate locale formatters independently.

## Accessibility

React Native 0.86 does not expose `accessibilityRole="table"`. The universal renderer therefore avoids an invalid role. Row and cell content remains labeled/readable, and a later web-specific specialization will provide native HTML table semantics during the dedicated accessibility/browser-hardening gate.

## Portability

Feature apps are prevented from importing third-party table/grid libraries directly. If a future product genuinely needs an enterprise-scale data grid, it should be introduced behind a reviewed adapter rather than becoming a feature-level dependency.

## Density and compact detail composition

- `AdaptiveDataTable` changes structure at responsive breakpoints and also reduces cell/card spacing when runtime density is compact.
- `KeyValueList` stacks label/value pairs on compact viewports instead of squeezing long values into a narrow second column; medium and expanded widths return to aligned two-column composition.
- `ListRow` owns the same horizontal inset for static and interactive rows so mixing informational and actionable rows never shifts the content axis.

## Search and filter workspace ownership

`DataToolbar` owns the responsive search shell, filter-chip wrapping, result summary, and compact action geometry for data-heavy screens. Feature routes supply semantic query/filter state and actions; they do not recreate toolbar geometry.

`SectionHeader` owns repeatable section title/description/accessory hierarchy. Use it inside cards and workspaces instead of hand-building `HStack + VStack + Text` heading compositions.

## Sorting and bulk selection

`AdaptiveDataTable` owns the interaction grammar for sortable headers and multi-row selection. Mark sortable columns with `sortable` plus a stable `sortValue`, keep the current `DataSort` controlled by the feature, and use `sortDataRows` before pagination so ordering is deterministic across the full filtered dataset.

Multi-selection is also controlled. Pass `selection.selectedKeys`, `selection.onSelectionChange`, and a human-readable `getRowLabel`. The table renders a mixed-state select-all checkbox for the visible page and keeps selection controls as siblings of row-action pressables so web output never nests interactive controls. Pair a non-zero selection with `SelectionBar`; that component owns the compact stack/desktop row transition, action hierarchy, live selection summary, and clear behavior.

## Scale, filters, and refresh

Use `ListScreen` / `SectionListScreen` for long virtualized data and retain query data while a
shared refresh is in progress. `AdaptiveDataTable` is for bounded operational tables; it adapts to
structured compact records rather than pretending every desktop column fits on a phone.

`CursorPagination` and `InfinitePagination` receive product-owned cursor/page mechanics and
server-state lifecycle values. They own busy/end/retry semantics; a route does not create another
next-page state machine. `useDataColumnVisibility` keeps a controlled visibility model and protects
the primary identity column. `FilterDrawer` owns compact filter overlay, apply/clear actions, safe
areas, keyboard, and focus restoration. Desktop filter content can remain inline through
`DataToolbar`.

Sticky virtual table headers, column resizing/pinning, and offline mutation queues are deliberately
not part of this foundation. They need workload-specific performance and conflict semantics rather
than a faux enterprise grid.

## Timeline and event history

`Timeline` presents a named chronological sequence with product-owned order, timestamps, title,
description, metadata, action, and optional named status. It owns the marker/connector rail,
logical RTL placement, compact density, and long-content behavior. Use `FeedListLayout` for a
general feed; Timeline is for structured event history, not a replacement for every list.

## Copy and export

`serializeDelimitedData` handles deterministic CSV/tab/semicolon serialization, including header
and multiline quoting. It does not decide export authorization, collect rows, create files, or
choose a delivery destination. Pair its output with `CopyableCode`/`CopyButton` or the optional
sharing capability after the product has explicitly authorized export.

A saved-view recipe combines controlled DataToolbar filters/sort/column visibility with the
optional preferences capability. Products define the schema and query mapping; Expo Base does not
silently persist filters or create a generic view-definition DSL.

The enterprise boundary is final: arbitrary column resizing/pinning/reordering, frozen panes,
spreadsheet editing, formulas, pivots, and aggregation engines require measured product demand and
a reviewed optional grid adapter.
