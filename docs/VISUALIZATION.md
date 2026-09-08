# Visualization system

Gate 10 provides a lightweight universal chart foundation on the already-approved `react-native-svg` layer.

## Core components

- `LineChart`
- `AreaChart`
- `Sparkline`
- `BarChart`
- `StackedBarChart` (up to six non-negative series)
- `DonutChart`
- `ProgressBar`
- `ProgressRing`

## System-owned behavior

- Chart frames measure their own available width; feature screens do not query viewport size or generate SVG geometry.
- Scale, bounds, point, path, bar, progress, and summary functions live as platform-neutral pure functions in `@precision-calm/platform`.
- The light and dark themes each define six visualization-series colors. Product screens select a semantic series slot instead of literal colors.
- Chart dimensions, line width, point radius, fill opacity, grid width, and progress geometry are theme tokens.
- Invalid numeric values are filtered before geometry generation, preventing `NaN`/`Infinity` SVG output.
- Core charts expose textual summaries to assistive technology and progress controls expose native range semantics.
- Line/bar marks support persistent tap selection when an `onSelect` handler is supplied.
- `ChartFrame` owns ready/loading/empty/error anatomy. `ChartLegend` and `ChartDataTable` provide
  a visible, keyboard-readable data fallback; product code supplies domain labels and summaries.
- `DonutChart` supplies bounded categorical composition, selected segment state, legend, and table
  fallback. It is not a generic radial dashboard engine.
- `StackedBarChart` reuses the six-slot semantic palette and provides legend plus visible
  multi-series table fallback. Products map domain series to slots deliberately and keep stacks
  bounded enough to read.
- `AreaChart` shares the LineChart scale/path/state implementation. `Sparkline` remains the compact
  trend owner for metric cards and table cells.
- Current charts avoid decorative entrance motion. Existing reduced-motion policy therefore leaves
  data and structural feedback intact without route-level animation branches.

## Advanced charts

The core package intentionally avoids locking the whole application platform to a heavyweight chart engine. Its platform-neutral math now owns finite domains, nice numeric boundaries, linear and band scales, deterministic ticks, min/max downsampling, histogram bins, heatmap cells, and waterfall geometry. These functions are pure and usable in native or web renderers without importing SVG.

`@precision-calm/visualization-advanced` is an opt-in Golden Module. It provides `ScatterPlot`, `Histogram`, and `Heatmap` while reusing `ChartFrame`, the shared palette, shared responsive heights, named touch targets, and visible data-table fallback. It is intentionally not re-exported by `@precision-calm/ui`, not included by the minimal generator, and not a vendor chart engine.

The advanced module is appropriate for exploratory relationship, distribution, and matrix views. It is not an enterprise grid, mapping system, rich editor, realtime GPU renderer, or financial trading engine. Fully interactive axes/tooltip collision, arbitrary composites, dense financial candlesticks, geographic/maps, and GPU-heavy realtime charts remain optional adapter or product-specialist boundaries until a real product supplies evidence.

## Performance and accessibility contract

Line/area previews can use `downsampleMinMax` for dense data while preserving first/last and bucket extrema. The chart layer should expose bounded summaries and a structured data fallback instead of rendering tens of thousands of DOM rows. Every material chart state keeps a named summary, and interactive marks are explicit controls; no critical meaning depends on hover or color alone.
