# Portability contract

Precision Calm is designed so product applications can change product domain, backend, hosting provider, brand and device composition without rewriting the UI foundation.

## Boundaries

- tokens contain no React, Expo or backend code
- platform contracts contain no React Native, Expo or backend code
- feature routes cannot own arbitrary geometry, viewport measurement, z-index, raw scrolling or direct icon/SVG engines
- navigation UI is independent from Expo Router; the router adapter owns Router-specific APIs
- form UI is independent from React Hook Form; the optional adapter owns that dependency
- product applications consume the shared packages rather than copy their source

## Generated applications

`npm run create:app -- --name "Product" --slug product --accent blue`

creates a new Expo workspace with its own brand and identifiers while retaining the same platform packages.

## Native configuration

Applications remain compatible with Expo Continuous Native Generation. Product-native modifications should be expressed through app config/config plugins rather than long-lived manual edits to generated `ios/` or `android/` projects.
