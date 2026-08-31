# Visualization system

Gate 10 provides a lightweight universal chart foundation on the already-approved `react-native-svg` layer.

## Core components

- `LineChart` / optional area fill
- `Sparkline`
- `BarChart`
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

## Advanced charts

The core package intentionally avoids locking the whole application platform to a heavyweight chart engine. Specialized future requirements such as dense financial candlesticks, large scatter plots, or GPU-heavy realtime charts should be introduced behind reviewed adapters with the same Precision Calm public contracts.
