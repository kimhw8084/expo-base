# Data and content system

Gate 09 establishes the product-neutral primitives used for dense operational and financial information.

## Contracts

- `Metric` and `MetricGroup` provide numeric hierarchy without forcing every metric into a decorative card.
- `KeyValueList` provides labeled detail data with safe wrapping.
- `ListRow` provides a dense, interactive content row with system-owned geometry and interaction states.
- `AdaptiveDataTable` does **not** squeeze a desktop table into a phone. Compact/medium capability regimes render structured records; expanded/wide regimes render a columnar view.
- `Pagination` uses the shared pure pagination-window solver.
- Currency, percent, and compact-number formatting live in `@precision-calm/platform`; feature screens do not instantiate locale formatters independently.

## Accessibility

React Native 0.86 does not expose `accessibilityRole="table"`. The universal renderer therefore avoids an invalid role. Row and cell content remains labeled/readable, and a later web-specific specialization will provide native HTML table semantics during the dedicated accessibility/browser-hardening gate.

## Portability

Feature apps are prevented from importing third-party table/grid libraries directly. If a future product genuinely needs an enterprise-scale data grid, it should be introduced behind a reviewed adapter rather than becoming a feature-level dependency.
