# Gate 05 — Forms contract

Precision Calm forms separate **visual controls** from **form-state orchestration**.

- `@precision-calm/forms` owns labels, inputs, focus/error states, selection controls, semantic geometry, and accessible anatomy.
- `@precision-calm/form-rhf` is an optional React Hook Form adapter. Product UI does not import `react-hook-form` directly.
- `FormScreen` owns keyboard-aware scrolling and toolbar behavior through `react-native-keyboard-controller`.
- Finite selection uses `SelectField`, `RadioGroup`, or `SegmentedField`; searchable selection uses
  `ComboboxField` / `MultiSelectField`. These use the shared Popover/Menu ownership rather than
  feature-owned popup positioning.

## Field rules

1. Visible labels are mandatory for persistent fields.
2. Placeholder text is supplementary, never the only label.
3. Error text is persistent and semantic; critical validation is not toast-only.
4. Focus does not alter geometry. The focus ring uses shadow/outline treatment around the existing border.
5. Single-line fields use React Native `submitBehavior`; deprecated `blurOnSubmit` is not part of the API.
6. `FormScreen` is the only general-purpose multi-field vertical scroll owner.
7. Feature code may not import raw `TextInput`, `Switch`, `KeyboardAvoidingView`, `react-hook-form`, or `react-native-keyboard-controller`.
8. Use the semantic field that matches the value. Do not build raw select overlays, locale parsing,
   OTP focus mechanics, or checkbox-group error anatomy in a route.


## Keyboard and validation lifecycle

- Product screens use `createPrecisionFormKeyboardFlow(form)` from `@precision-calm/form-rhf` instead of hand-authoring return-key behavior.
- `next(field)` uses `returnKeyType="next"` with `submitBehavior="submit"`, then delegates focus to React Hook Form's registered field ref.
- `done(submit)` uses `returnKeyType="done"` with `submitBehavior="blurAndSubmit"` and invokes the canonical form submit handler.
- `usePrecisionForm` keeps `shouldFocusError: true`; every controlled focusable field, including checkbox rows, must register `field.ref` so the first invalid field is deterministic.
- Shared fields expose validation state to web accessibility APIs (`aria-invalid`, `aria-describedby`, `aria-required`) and provide native accessibility hints. Error messages are polite live regions so validation changes are announced without feature-owned accessibility code.

## Shared form lifecycle

For supported form workflows, `@precision-calm/forms` owns `FormErrorSummary`,
`FormDiscardDialog`, and `useFormLeaveGuard`. The optional `@precision-calm/form-rhf` adapter
adds `usePrecisionFormLifecycle` and `applyPrecisionFormServerErrors`: it focuses the first
invalid registered field, presents one post-submit alert summary, maps server field/root errors,
and resets only through a confirmed dirty-state leave flow. Product routes supply domain copy and
the navigation continuation; they do not build a second error summary or discard modal.

`usePrecisionFieldArray` provides RHF-safe append/insert/remove with stable keys and focused
insertions. `usePrecisionConditionalField` makes hidden-value reset/preserve policy explicit.
`createPrecisionAsyncValidator` owns abort/revision suppression for field checks, while
`usePrecisionAutosave` provides opt-in, explicitly timed dirty save/retry behavior. Autosave never
persists locally or resolves offline conflicts by itself: products choose a service mutation and
any selected Phase 4 storage capability.

Universal router leave interception remains limited by the installed cross-platform router.
`useFormLeaveGuard` is the supported confirmation boundary; products must not add navigation
patches or timing hacks to simulate a universal before-leave hook.

## Input and selection depth

- `EmailField`, `UrlField`, and `PhoneField` provide semantic input hints and normalized,
  presentation-ready validation helpers. Regional telephone business rules remain product-owned.
- `NumberField` and `CurrencyField` keep editable text separate from parsed values. They parse
  locale decimal/grouping symbols through `@precision-calm/i18n` and format on blur, never while a
  user is midway through an edit. `NumberStepper` is for bounded discrete values.
- `ComboboxField` and `MultiSelectField` own searchable menu navigation, loading, no-results,
  disabled-option, Escape, Enter, and selected-state behavior. A product owns option loading and
  query keys; it does not assemble Popover + ListRow repeatedly.
- `CheckboxGroup`, `RadioGroup`, `SwitchField`, and `SegmentedField` own group labels, errors, and
  selected/disabled semantics.
- `CodeField` owns accessible OTP/PIN cell focus, paste, Backspace, numeric keyboard hints, and
  one-time-code autofill hints. It does not implement an authentication backend.

## Date and time values

`DateField`, `TimeField`, and `DateRangeField` provide the portable kernel contract:

- calendar dates use `YYYY-MM-DD` and never pass through the device timezone;
- wall-clock values use 24-hour `HH:mm` transport while the helper preview follows locale 12/24h;
- range order, min/max values, visible labels, shared errors, and compact stacking are explicit;
- parsing/formatting helpers live in `@precision-calm/platform`.

The fields deliberately do not claim to be a calendar/scheduling system. A product may register a
reviewed optional native picker adapter that reads/writes the same value shapes, but the minimal
kernel has no native picker dependency. Current Expo picker choices expose materially different
Android/iOS/web lifecycles, and native runtime acceptance is required before Expo Base sanctions
one implementation. Recurrence, booking rules, disabled-date business logic, and timezone
conversion remain product-owned. Slider/range input remains deferred until real demand proves a
cross-platform interaction contract superior to `NumberStepper` or explicit numeric fields.

## Responsive field rows

Use `FormRow` for short, related fields that should share one row at medium-and-larger regimes and stack at compact widths. The form package owns equal-width cells, minimum-width protection, and responsive direction; feature screens should not recreate this with local `HStack` geometry.

## Production form sections

Use `FormSectionGroup` when a form contains multiple conceptual groups such as profile, security, billing, or consent. Each `FormSection` owns its eyebrow/title/description/accessory hierarchy and exposes its title as a semantic header. `FormSectionGroup` owns tokenized separation between groups; feature routes should not recreate section dividers, spacing, or responsive header geometry.

Use `FormRow` only for fields that are meaningfully related. It stacks on compact layouts and pairs fields from the medium regime upward. Keep submission controls in `FormActions` so action ordering and compact full-width behavior remain consistent.
