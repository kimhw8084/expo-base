# Internationalization and direction

`@precision-calm/i18n` is the always-on locale kernel. It deliberately uses the platform `Intl`
implementation and a small message contract instead of a translation vendor or a mandatory large
dependency.

Configure it once through `PrecisionRuntimeProvider`:

```tsx
<PrecisionRuntimeProvider
  i18n={{
    locale: productLocale,
    fallbackLocale: 'en-US',
    messages: productMessages,
  }}
>
  <App />
</PrecisionRuntimeProvider>
```

The kernel owns locale normalization/detection, fallback lookup, plural selection, interpolation,
number/currency/percent/date formatting, timezone-aware dates, collation, direction, directional
icon mirroring, and deterministic pseudo locales. Products own message IDs, translated strings,
business copy, and any translation-management integration.

Use `usePrecisionI18n()` for `t`, formatters, and locale-aware comparison. Use semantic
`start`/`end` text alignment and shared layout owners; do not branch feature geometry for RTL.
`en-XA` is a deterministic expanded pseudo-LTR locale, while `en-XB` combines expanded copy with
RTL direction. They are stress modes, not production locales.

Native text remains user-scalable. Shared text caps `maxFontSizeMultiplier` at 2, uses minimum
rather than fixed control heights, and allows actions/form rows to recompose. Compact primary
navigation owns a controlled multi-line visible-label policy (up to three lines): localized destinations must remain
recognizable to sighted users as well as retain their full accessible names. Validate substantial
changes at compact width and the reference pseudo/RTL controls before certification.

## Locale-aware editable values

Use `NumberField` and `CurrencyField` for editable numeric values. The fields use the locale
kernel's deterministic decimal/grouping parser, preserve in-progress input, and format only after
editing completes. Products own domain precision, min/max, and currency policy. Do not use
`Number(value)`, US-only regular expressions, or `toLocaleString` in a feature field. Date/time
editing remains intentionally unsanctioned pending one reviewed native/browser picker boundary.
