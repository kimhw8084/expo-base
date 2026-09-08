import type { ChartDatum } from '@precision-calm/platform';
import type { AdvancedSeriesDatum, AdvancedSeriesDefinition, RangeBarDatum } from '@precision-calm/visualization-advanced';

export const showcaseSeries: AdvancedSeriesDefinition[] = [
  { key: 'current', label: 'Current period', series: 'series1' },
  { key: 'previous', label: 'Previous period', series: 'series2' },
  { key: 'target', label: 'Target', series: 'series4' },
];
export const showcaseTrend: AdvancedSeriesDatum[] = [
  { label: 'Jan', values: { current: 42, previous: 37, target: 40 } },
  { label: 'Feb', values: { current: 48, previous: 41, target: 44 } },
  { label: 'Mar', values: { current: 46, previous: 45, target: 47 } },
  { label: 'Apr', values: { current: 58, previous: 49, target: 51 } },
  { label: 'May', values: { current: 64, previous: 54, target: 58 } },
  { label: 'Jun', values: { current: 71, previous: 61, target: 64 } },
];
export const showcaseSegmentComparison: AdvancedSeriesDatum[] = [
  { label: 'Enterprise', values: { current: 42, previous: 36 } },
  { label: 'Growth', values: { current: 29, previous: 27 } },
  { label: 'Starter', values: { current: 18, previous: 21 } },
  { label: 'Other', values: { current: 11, previous: 16 } },
];
export const showcaseBreakdown: ChartDatum[] = [
  { label: 'Enterprise', value: 42 }, { label: 'Growth', value: 29 }, { label: 'Starter', value: 18 }, { label: 'Other', value: 11 },
];
export const showcaseWaterfall = [
  { label: 'Opening', value: 840, kind: 'total' as const },
  { label: 'New', value: 180, kind: 'increase' as const },
  { label: 'Expansion', value: 95, kind: 'increase' as const },
  { label: 'Churn', value: -72, kind: 'decrease' as const },
  { label: 'Closing', value: 1043, kind: 'total' as const },
];
export const showcaseRanges: RangeBarDatum[] = [
  { label: 'Activation', min: 42, max: 78 }, { label: 'Retention', min: 54, max: 91 }, { label: 'Expansion', min: 28, max: 63 },
];
export const showcaseTable = [
  { label: 'Northwind', value: '$184,200', status: 'On track' },
  { label: 'Keystone', value: '$142,880', status: 'Review' },
  { label: 'Sundial', value: '$96,420', status: 'On track' },
  { label: 'Meridian', value: '$84,760', status: 'At risk' },
];
