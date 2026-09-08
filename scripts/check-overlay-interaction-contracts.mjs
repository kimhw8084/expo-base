import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const failures = [];

const lifecycle = read('packages/overlays/src/useOverlayLifecycle.ts');
if (!lifecycle.includes('dismissOnEscape?: boolean')) failures.push('Overlay lifecycle must expose explicit Escape-dismiss policy.');
if (!lifecycle.includes('restoreFocus?: boolean')) failures.push('Overlay lifecycle must expose focus-restoration policy.');
if (!lifecycle.includes('trapFocus?: boolean')) failures.push('Overlay lifecycle must expose an explicit focus-trap policy.');
if (!lifecycle.includes('containerRef?: RefObject<unknown>')) failures.push('Overlay lifecycle must receive a shared overlay container for focus management.');
if (!lifecycle.includes('restoreFocusId?: string')) failures.push('Anchored overlays must be able to identify their concrete focus-restoration target.');
if (!lifecycle.includes('target.document.activeElement')) failures.push('Overlay lifecycle must capture the pre-overlay web focus target.');
if (!lifecycle.includes('requestAnimationFrame')) failures.push('Overlay lifecycle must restore focus after modal teardown.');
if (!lifecycle.includes('const previousTarget = restoreTarget.current;')) failures.push('Overlay lifecycle must capture a null-safe deferred focus target.');
if (!lifecycle.includes('targetToRestore.focus();')) failures.push('Overlay lifecycle must restore the captured focus target after null narrowing.');
if (!lifecycle.includes("querySelectorAll('button")) failures.push('Overlay lifecycle must enumerate focusable elements structurally when trapping focus.');
if (!lifecycle.includes("querySelector?.('[aria-modal=\"true\"]')")) failures.push('Overlay lifecycle must resolve the rendered web modal when a native view ref is not focusable.');
if (!lifecycle.includes('mayRestoreFocus')) failures.push('Overlay lifecycle must not restore stale focus while another overlay is active.');
if (!lifecycle.includes('if (!open || !dismissOnEscape) return;')) failures.push('Escape listener must respect the overlay dismiss policy.');

const dialog = read('packages/overlays/src/Dialog.tsx');
if (!dialog.includes('dismissOnEscape?: boolean')) failures.push('Dialog must expose explicit Escape-dismiss policy.');
if (!dialog.includes('dismissOnEscape = dismissOnBackdrop')) failures.push('Dialog must default Escape dismissal to the backdrop-dismiss policy so explicit-action alerts stay locked.');
if (!dialog.includes('trapFocus: true')) failures.push('Dialog must opt into the shared focus trap.');
if (!dialog.includes('aria-modal')) failures.push('Dialog must expose modal semantics on web.');
if (!dialog.includes("role={kind === 'alert' ? 'alertdialog' : 'dialog'}")) failures.push('Destructive confirmations must expose alertdialog rather than a duplicate alert.');
if (!dialog.includes('ModalSurface')) failures.push('Dialog must use the semantic-free web modal host.');
if (!dialog.includes('onRequestClose={() => { if (dismissOnEscape) close(); }}')) failures.push('Dialog native back/request-close must respect the Escape-dismiss policy.');

const sheet = read('packages/overlays/src/BottomSheet.tsx');
if (!sheet.includes('dismissOnEscape?: boolean')) failures.push('BottomSheet must expose explicit Escape-dismiss policy.');
if (!sheet.includes('trapFocus: true')) failures.push('BottomSheet must opt into the shared focus trap.');
if (!sheet.includes('aria-modal')) failures.push('BottomSheet must expose modal semantics on web.');
if (!sheet.includes('footer?: ReactNode')) failures.push('BottomSheet must support a persistent footer outside scrolling content.');
if (!sheet.includes('ModalSurface')) failures.push('BottomSheet must use the semantic-free web modal host.');
if (!sheet.includes('onRequestClose={() => { if (dismissOnEscape) close(); }}')) failures.push('BottomSheet native back/request-close must respect the Escape-dismiss policy.');

const popover = read('packages/overlays/src/Popover.tsx');
if (!popover.includes('useOverlayLifecycle(open, close, {')) failures.push('Popover must keep shared Escape/focus lifecycle ownership.');
if (!popover.includes('restoreFocusId: restoreFocusId ?? anchorId')) failures.push('Popover must restore focus to the actual invoking control.');
if (!popover.includes('persistentBottomInset')) failures.push('Popover must account for persistent navigation in its collision bounds.');

const menu = read('packages/overlays/src/ActionMenu.tsx');
if (!menu.includes('resolveRovingFocusIndex')) failures.push('ActionMenu must own arrow/Home/End roving focus.');
if (!menu.includes('tabIndex={!item.disabled && index === focusedIndex ? 0 : -1}')) failures.push('ActionMenu must expose one enabled menuitem tab stop.');

if (failures.length) {
  console.error('Overlay interaction contract violations:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Overlay keyboard/dismiss/focus-restoration contracts passed.');
