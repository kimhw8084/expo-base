import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const forms = read('packages/forms/src/FormLifecycle.tsx');
const rhf = read('packages/form-rhf/src/index.tsx');
const reference = read('apps/reference/app/forms.tsx');
const webTests = read('tests/e2e/web/reference.spec.ts');
const failures = [];

for (const marker of ['FormErrorSummary', 'accessibilityRole="alert"', 'FormDiscardDialog', 'dismissOnBackdrop={false}', 'useFormLeaveGuard', 'pendingLeave']) {
  if (!forms.includes(marker)) failures.push(`Form lifecycle owner must include ${marker}.`);
}
for (const marker of ['applyPrecisionFormServerErrors', "'root.server'", 'usePrecisionFormErrorSummary', 'usePrecisionFormLifecycle', 'form.formState.isDirty']) {
  if (!rhf.includes(marker)) failures.push(`RHF lifecycle adapter must include ${marker}.`);
}
for (const marker of ['usePrecisionFieldArray', 'usePrecisionConditionalField', 'createPrecisionAsyncValidator', 'usePrecisionAutosave', 'AbortController', 'requestRevision === revision.current']) {
  if (!rhf.includes(marker)) failures.push(`RHF lifecycle depth must include ${marker}.`);
}
for (const marker of ['usePrecisionFormLifecycle(form, demoFormFields)', 'FormErrorSummary errors={lifecycle.errors}', 'FormDiscardDialog guard={lifecycle.leaveGuard}', 'Apply server validation', 'Leave form']) {
  if (!reference.includes(marker)) failures.push(`Reference form must prove ${marker}.`);
}
for (const name of ['form lifecycle summarizes errors and protects dirty navigation', 'form lifecycle maps server errors into the shared summary']) {
  if (!webTests.includes(name)) failures.push(`Web certification must cover ${name}.`);
}

if (failures.length) {
  console.error('Form lifecycle contract violations:\n' + failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Form lifecycle contract passed (error summary, server mapping, reset, and dirty leave protection).');
