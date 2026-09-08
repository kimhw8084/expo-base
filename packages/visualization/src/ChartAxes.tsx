import Svg, { G, Line, Text as SvgText } from 'react-native-svg';
import { chartTicks, formatCompactNumber, niceDomain, type NumericDomain } from '@precision-calm/platform';
import { useUnistyles } from 'react-native-unistyles';
import type { ChartValueFormatter } from './types';

export interface ChartAxesProps {
  width: number;
  height: number;
  xDomain?: NumericDomain;
  yDomain?: NumericDomain;
  xFormatter?: ChartValueFormatter;
  yFormatter?: ChartValueFormatter;
  xLabels?: readonly string[];
  inset?: number;
  showGrid?: boolean;
  rtl?: boolean;
  testID?: string;
}

/** Shared, deliberately small SVG axis anatomy for core and advanced charts. */
export function ChartAxes({ width, height, xDomain, yDomain, xFormatter = formatCompactNumber, yFormatter = formatCompactNumber, xLabels, inset = 24, showGrid = true, rtl = false, testID }: ChartAxesProps) {
  const { theme } = useUnistyles();
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  const plotWidth = Math.max(0, safeWidth - inset * 2);
  const plotHeight = Math.max(0, safeHeight - inset * 2);
  const yTicks = yDomain ? chartTicks(niceDomain(yDomain), 4, yFormatter) : [];
  const xTicks = xDomain ? chartTicks(niceDomain(xDomain), 4, xFormatter) : [];
  const xPosition = (ratio: number) => rtl ? safeWidth - inset - ratio * plotWidth : inset + ratio * plotWidth;
  const yPosition = (ratio: number) => inset + (1 - ratio) * plotHeight;
  return (
    <Svg pointerEvents="none" width={safeWidth} height={safeHeight} viewBox={`0 0 ${safeWidth} ${safeHeight}`} {...(testID ? { testID } : {})}>
      <G>
        {showGrid ? yTicks.map((tick) => <Line key={`y-grid-${tick.value}`} x1={inset} x2={safeWidth - inset} y1={yPosition(tick.position)} y2={yPosition(tick.position)} stroke={theme.colors.border.subtle} strokeWidth={theme.visualizationMetrics.gridLineWidth} />) : null}
        <Line x1={inset} x2={safeWidth - inset} y1={safeHeight - inset} y2={safeHeight - inset} stroke={theme.colors.border.default} strokeWidth={theme.visualizationMetrics.gridLineWidth} />
        <Line x1={rtl ? safeWidth - inset : inset} x2={rtl ? safeWidth - inset : inset} y1={inset} y2={safeHeight - inset} stroke={theme.colors.border.default} strokeWidth={theme.visualizationMetrics.gridLineWidth} />
        {yTicks.map((tick) => <SvgText key={`y-label-${tick.value}`} x={rtl ? safeWidth - 4 : 4} y={yPosition(tick.position) + 4} fill={theme.colors.text.secondary} fontSize={theme.typography.micro.fontSize} textAnchor={rtl ? 'end' : 'start'}>{tick.label}</SvgText>)}
        {xDomain ? xTicks.map((tick) => <SvgText key={`x-label-${tick.value}`} x={xPosition(tick.position)} y={safeHeight - 6} fill={theme.colors.text.secondary} fontSize={theme.typography.micro.fontSize} textAnchor="middle">{tick.label}</SvgText>) : xLabels?.map((label, index) => { const ratio = xLabels.length <= 1 ? 0.5 : index / (xLabels.length - 1); return <SvgText key={`x-category-${label}-${index}`} x={xPosition(ratio)} y={safeHeight - 6} fill={theme.colors.text.secondary} fontSize={theme.typography.micro.fontSize} textAnchor="middle">{label}</SvgText>; })}
      </G>
    </Svg>
  );
}
