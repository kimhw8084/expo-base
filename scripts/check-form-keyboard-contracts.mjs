import fs from 'node:fs';
import process from 'node:process';

const read = (file) => fs.readFileSync(file, 'utf8');
const adapter = read('packages/form-rhf/src/index.tsx');
const textField = read('packages/forms/src/TextField.tsx');
const textArea = read('packages/forms/src/TextArea.tsx');
const selectField = read('packages/forms/src/SelectField.tsx');
const selection = read('packages/forms/src/Selection.tsx');
const formField = read('packages/forms/src/FormField.tsx');
const reference = read('apps/reference/app/forms.tsx');
const webTests = read('tests/e2e/web/reference.spec.ts');
const failures = [];

if (!adapter.includes('shouldFocusError: true')) failures.push('RHF adapter must keep deterministic first-invalid-field focus enabled.');
if (!adapter.includes('createPrecisionFormKeyboardFlow')) failures.push('RHF adapter must own Next/Done keyboard flow.');
if (!adapter.includes("returnKeyType: 'next'") || !adapter.includes("submitBehavior: 'submit'")) failures.push('Next flow must submit without blurring before moving focus.');
if (!adapter.includes("returnKeyType: 'done'") || !adapter.includes("submitBehavior: 'blurAndSubmit'")) failures.push('Done flow must blur and submit deterministically.');
if (!adapter.includes('ref={field.ref}') || !selection.includes('forwardRef<View, CheckboxProps>')) failures.push('Controlled checkbox must register a focusable RHF ref.');
if (!adapter.includes('onBlur={field.onBlur}') || !selection.includes('interactionProps.onBlur(); onBlur?.();')) failures.push('Controlled checkbox must preserve RHF blur/touched semantics while retaining interaction focus state.');
for (const [name, source] of [['TextField', textField], ['TextArea', textArea], ['SelectField', selectField], ['Checkbox', selection]]) {
  if (!source.includes("'aria-invalid': Boolean(error)")) failures.push(`${name} must expose web validation state.`);
  if (!source.includes("'aria-describedby': messageId")) failures.push(`${name} must associate its validation/description message.`);
  if (!source.includes("'aria-errormessage': error ? messageId : undefined")) failures.push(`${name} must expose the active error-message relationship on web.`);
  if (!source.includes('accessibilityHint={accessibilityHint}')) failures.push(`${name} must expose native validation/required hints.`);
}
if (textField.includes("'aria-readonly': readOnly")) failures.push('TextField must not forward aria-readonly through the React Native Web TextInput compatibility path.');
if (!textField.includes("readOnly={Platform.OS === 'web' ? disabled || readOnly : undefined}")) failures.push('TextField must use the web readOnly prop for editability ownership.');
if (!textField.includes("editable={Platform.OS === 'web' ? undefined : !disabled && !readOnly}")) failures.push('TextField must keep editable ownership native-only.');
if (!formField.includes('accessibilityLiveRegion="polite"') || !formField.includes('aria-live="polite"')) failures.push('Form error messages must use polite universal live-region semantics.');
if (!selection.includes('accessibilityLiveRegion="polite"') || !selection.includes('aria-live="polite"')) failures.push('Checkbox errors must use polite universal live-region semantics.');
if (!reference.includes('createPrecisionFormKeyboardFlow(form)')) failures.push('Reference form must prove the shared keyboard-flow adapter.');
if (!reference.includes('createPrecisionFormSubmit(form')) failures.push('Reference form must use the shared interaction-stable submit owner.');
if (/returnKeyType=/.test(reference) || /submitBehavior=/.test(reference)) failures.push('Reference product form must not hand-author return-key mechanics.');
if (!webTests.includes('form keyboard flow advances focus and validation returns to the first invalid field')) failures.push('Web certification must cover keyboard flow and first-invalid focus.');
if (!webTests.includes('await expect(name).toBeEditable();')) failures.push('Web certification must prove the primary form field remains editable.');



if (!reference.includes('usePrecisionFormLifecycle(form, demoFormFields)')) failures.push('Reference form must prove post-commit deterministic invalid-field focus through the lifecycle owner.');

if (!adapter.includes('submitCount === 0') || !adapter.includes('handledSubmitCount.current = 0')) failures.push('Shared invalid-field focus must reset its handled submission count when RHF resets form state.');

if (!adapter.includes('usePrecisionFormErrorFocus') || !adapter.includes('submitCount') || !adapter.includes('handledSubmitCount') || !adapter.includes('form.setFocus(firstInvalid)')) failures.push('Shared form adapter must focus the first invalid field directly from the committed invalid-state effect.');

if (failures.length) {
  console.error('Form keyboard/validation contract violations:\n' + failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log('Form keyboard/validation contract passed.');
