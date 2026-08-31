import type { ChartDatum } from '@precision-calm/platform';
import { LineChart } from './LineChart';
import type { VisualizationSeries } from './types';

export function Sparkline({ data, name = 'Trend', series = 'series1' }: { data: readonly ChartDatum[]; name?: string; series?: VisualizationSeries }) {
  return <LineChart data={data} name={name} size="sparkline" series={series} showGrid={false} />;
}
