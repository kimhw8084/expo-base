# ADR: Core and Advanced Visualization Boundary

Status: accepted

## Decision

Expo Base keeps the ordinary chart contract in `@precision-calm/visualization` and
places specialized, still product-neutral chart families in the optional
`@precision-calm/visualization-advanced` workspace.

The core owns the stable frame, state anatomy, semantic data fallback, shared
tokens, and the platform-neutral math needed by common line, area, bar, donut,
progress, and sparkline presentations. The advanced module reuses those
contracts and currently provides scatter, histogram, and heatmap presentations.

Neither layer imports a DOM charting framework or exposes vendor-specific
configuration. Features consume named owners and data contracts, not raw SVG
geometry or a chart-library API.

## Rationale

Advanced visualization is useful across unrelated products, but it is not part
of every generated application's startup or dependency graph. Keeping it in a
separate workspace makes the boundary explicit, preserves tree-shaking and
route-level loading, and leaves room for future specialist adapters such as
maps or very large GPU-backed plots without making them kernel dependencies.

The math layer is deterministic and platform-neutral. It sanitizes invalid
values, produces finite domains/ticks/bins/cells, supports bounded min/max
downsampling, and is benchmarked independently of rendering. Rendering uses
the existing chart frame, feedback states, theme tokens, and accessible data
table fallback.

## Certification contract

Every advanced owner must provide:

- deterministic normal, empty, loading, and error states;
- a named accessible summary and structured data fallback;
- touch/keyboard-safe selection when interaction is enabled;
- light/dark, compact/wide, RTL, pseudo-content, and reduced-motion review;
- finite-data and adversarial geometry tests;
- a performance threshold and bundle-isolation check.

The module is intentionally not re-exported from the minimal UI facade. It is
catalogued as a manually selected optional module and is included only by
profiles or routes that explicitly use it.

## Boundaries

Maps, GIS, spreadsheet grids, rich editors, realtime trading engines, million-
point GPU rendering, and other specialist engines remain adapter or
product-specific concerns. They may consume the same data, accessibility, and
theme contracts without moving their infrastructure into the Golden Kernel.
