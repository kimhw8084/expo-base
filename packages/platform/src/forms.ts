export type ValidationCode =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'min'
  | 'max'
  | 'invalidNumber'
  | 'custom';

export interface ValidationIssue {
  code: ValidationCode;
  message: string;
}

export interface TextValidationRules {
  required?: string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
}

export interface NumberValidationRules {
  required?: string;
  min?: { value: number; message: string };
  max?: { value: number; message: string };
}

export interface FieldErrorSnapshot {
  name: string;
  order: number;
  message?: string;
}

export function validateText(value: string, rules: TextValidationRules): ValidationIssue | null {
  const normalized = value.trim();
  if (rules.required && normalized.length === 0) return { code: 'required', message: rules.required };
  if (rules.minLength && normalized.length < rules.minLength.value) return { code: 'minLength', message: rules.minLength.message };
  if (rules.maxLength && normalized.length > rules.maxLength.value) return { code: 'maxLength', message: rules.maxLength.message };
  if (rules.pattern && normalized.length > 0 && !rules.pattern.value.test(normalized)) return { code: 'pattern', message: rules.pattern.message };
  return null;
}

export function parseDecimalInput(value: string): number | null {
  const normalized = value.replace(/[^0-9+\-.]/g, '');
  if (!normalized || normalized === '-' || normalized === '+' || normalized === '.' || normalized === '-.' || normalized === '+.') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateNumber(value: string | number | null | undefined, rules: NumberValidationRules): ValidationIssue | null {
  if (value === null || value === undefined || value === '') {
    return rules.required ? { code: 'required', message: rules.required } : null;
  }
  const parsed = typeof value === 'number' ? value : parseDecimalInput(value);
  if (parsed === null) return { code: 'invalidNumber', message: 'Enter a valid number.' };
  if (rules.min && parsed < rules.min.value) return { code: 'min', message: rules.min.message };
  if (rules.max && parsed > rules.max.value) return { code: 'max', message: rules.max.message };
  return null;
}

export function firstInvalidField(fields: readonly FieldErrorSnapshot[]): FieldErrorSnapshot | null {
  return [...fields]
    .filter((field) => Boolean(field.message))
    .sort((a, b) => a.order - b.order)[0] ?? null;
}

export function formatCurrencyInput(value: string, fractionDigits = 2): string {
  const parsed = parseDecimalInput(value);
  if (parsed === null) return '';
  const safeDigits = Math.max(0, Math.min(6, Math.trunc(fractionDigits)));
  return parsed.toFixed(safeDigits);
}
