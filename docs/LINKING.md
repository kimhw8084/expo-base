# Safe external navigation and deep linking

Gate 34 centralizes URL behavior so product screens cannot invoke arbitrary destinations directly.

## Boundary

- Internal app navigation: `@precision-calm/navigation-router`
- URL policy and normalization: `@precision-calm/linking`
- Expo `openURL` / `canOpenURL`: `@precision-calm/linking-expo`
- Feature consumption: `usePrecisionLinking()` from `@precision-calm/runtime`
- Native incoming rewrite: `app/+native-intent.tsx`

## Default safety policy

Custom schemes are denied unless explicitly listed. HTTPS destinations require an explicit host allowlist unless the application deliberately enables `allowAnyHttpsHost`. HTTP, non-default ports, and `javascript:`, `data:`, `file:`, `vbscript:`, `blob:`, and `intent:` are blocked by default.

`mailto:` and `tel:` are opt-in because they can disclose user intent or launch another application.

Host matching is boundary-aware: allowing subdomains of `example.com` permits `a.example.com`, never `lookalikeexample.com` or `example.com.evil.test`.

## Incoming links

Expo Router remains the route owner. `+native-intent.tsx` performs only safe normalization/rewrite and returns a branded rejected-link route for malformed or untrusted input. It never throws. Universal-link hosts and custom app schemes are configured independently.

The application should prefer verified Android App Links and iOS Universal Links for production web-domain links; custom schemes remain useful for callbacks and integrations.

## Diagnostics

Never report a full auth callback URL. `redactUrlForDiagnostics()` removes query and fragment data so authorization codes, state, tokens, or other sensitive parameters are not copied into diagnostics.
