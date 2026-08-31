export interface ChartDatum {
  label: string;
  value: number;
}

export interface ChartPoint {
  x: number;
  y: number;
  datumIndex: number;
}

export interface ChartBounds {
  min: number;
  max: number;
  span: number;
}

export function finiteChartData(data: readonly ChartDatum[]): ChartDatum[] {
  return data.filter((item) => Number.isFinite(item.value) && item.label.trim().length > 0);
}

export function chartBounds(data: readonly ChartDatum[], includeZero = false): ChartBounds {
  const values = finiteChartData(data).map((item) => item.value);
  if (values.length === 0) return { min: 0, max: 1, span: 1 };
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (min === max) {
    const padding = Math.max(1, Math.abs(min) * 0.1);
    min -= padding;
    max += padding;
  }
  return { min, max, span: max - min };
}

export function chartPoints(data: readonly ChartDatum[], width: number, height: number, inset = 0, includeZero = false): ChartPoint[] {
  const clean = finiteChartData(data);
  if (clean.length === 0 || width <= 0 || height <= 0) return [];
  const safeInset = Math.max(0, Math.min(Math.min(width, height) / 2, inset));
  const innerWidth = Math.max(0, width - safeInset * 2);
  const innerHeight = Math.max(0, height - safeInset * 2);
  const bounds = chartBounds(clean, includeZero);
  return clean.map((item, index) => ({
    x: safeInset + (clean.length === 1 ? innerWidth / 2 : (index / (clean.length - 1)) * innerWidth),
    y: safeInset + (1 - (item.value - bounds.min) / bounds.span) * innerHeight,
    datumIndex: index,
  }));
}

export function linePath(points: readonly ChartPoint[]): string {
  if (points.length === 0) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${round(point.x)},${round(point.y)}`).join(' ');
}

export function areaPath(points: readonly ChartPoint[], baseline: number): string {
  if (points.length === 0 || !Number.isFinite(baseline)) return '';
  const line = linePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  return `${line} L${round(last.x)},${round(baseline)} L${round(first.x)},${round(baseline)} Z`;
}

export function barRects(data: readonly ChartDatum[], width: number, height: number, gap = 6): Array<{ x: number; y: number; width: number; height: number; datumIndex: number }> {
  const clean = finiteChartData(data);
  if (clean.length === 0 || width <= 0 || height <= 0) return [];
  const bounds = chartBounds(clean, true);
  const zeroY = (1 - (0 - bounds.min) / bounds.span) * height;
  const slot = width / clean.length;
  const safeGap = Math.max(0, Math.min(slot * 0.75, gap));
  const barWidth = Math.max(1, slot - safeGap);
  return clean.map((item, index) => {
    const valueY = (1 - (item.value - bounds.min) / bounds.span) * height;
    return {
      x: index * slot + safeGap / 2,
      y: Math.min(valueY, zeroY),
      width: barWidth,
      height: Math.max(1, Math.abs(zeroY - valueY)),
      datumIndex: index,
    };
  });
}

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function chartSummary(data: readonly ChartDatum[], name = 'Chart'): string {
  const clean = finiteChartData(data);
  if (clean.length === 0) return `${name}. No data.`;
  const min = clean.reduce((a, b) => (b.value < a.value ? b : a));
  const max = clean.reduce((a, b) => (b.value > a.value ? b : a));
  const first = clean[0];
  const last = clean[clean.length - 1];
  if (!first || !last) return `${name}. No data.`;
  const change = last.value - first.value;
  const direction = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'was unchanged';
  return `${name}. ${clean.length} points. Minimum ${min.value} at ${min.label}. Maximum ${max.value} at ${max.label}. From ${first.value} at ${first.label} to ${last.value} at ${last.label}, ${direction}.`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
