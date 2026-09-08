import { serializePrecisionDelimitedData } from '@precision-calm/platform';

export interface DataExportColumn<Row> {
  key: string;
  label: string;
  value: (row: Row) => string | number | boolean | null | undefined;
}

export interface DelimitedDataOptions {
  delimiter?: ',' | '\t' | ';';
  lineEnding?: '\n' | '\r\n';
  includeHeader?: boolean;
}

/** Deterministic serialization; file creation, authorization, and delivery remain product-owned. */
export function serializeDelimitedData<Row>(rows: readonly Row[], columns: readonly DataExportColumn<Row>[], options: DelimitedDataOptions = {}): string {
  return serializePrecisionDelimitedData(rows, columns, options);
}
