# Gate 05 — Forms contract

Precision Calm forms separate **visual controls** from **form-state orchestration**.

- `@precision-calm/forms` owns labels, inputs, focus/error states, selection controls, semantic geometry, and accessible anatomy.
- `@precision-calm/form-rhf` is an optional React Hook Form adapter. Product UI does not import `react-hook-form` directly.
- `FormScreen` owns keyboard-aware scrolling and toolbar behavior through `react-native-keyboard-controller`.
- Select, combobox, date picker, and anchored choice surfaces are intentionally deferred until the shared Overlay Manager exists. They must not introduce independent popup positioning.

## Field rules

1. Visible labels are mandatory for persistent fields.
2. Placeholder text is supplementary, never the only label.
3. Error text is persistent and semantic; critical validation is not toast-only.
4. Focus does not alter geometry. The focus ring uses shadow/outline treatment around the existing border.
5. Single-line fields use React Native `submitBehavior`; deprecated `blurOnSubmit` is not part of the API.
6. `FormScreen` is the only general-purpose multi-field vertical scroll owner.
7. Feature code may not import raw `TextInput`, `Switch`, `KeyboardAvoidingView`, `react-hook-form`, or `react-native-keyboard-controller`.
8. Select/combobox/date/time controls wait for the common overlay layer rather than shipping a temporary dropdown implementation.
