import { LineChart, type LineChartProps } from './LineChart';

export type AreaChartProps = Omit<LineChartProps, 'area'>;

/** Semantic area-chart owner sharing line scale, interaction, state, and fallback behavior. */
export function AreaChart(props: AreaChartProps) {
  return <LineChart {...props} area />;
}
