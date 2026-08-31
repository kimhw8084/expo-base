# New-app generator

`@precision-calm/create-app` produces a new Expo application workspace that consumes the shared platform instead of copying component source.

## Contract

- generated applications own product routes and brand configuration only
- generated applications do not fork design-system components
- brand accents are explicit light/dark semantic palettes
- Expo/React Native versions are pinned to the platform-certified baseline
- the output starts with Expo Router, CNG-ready app config, Unistyles registration, keyboard/motion/overlay roots, and one adaptive golden layout
- backend integrations remain optional adapters

## Example

`node packages/create-precision-app/bin/create-precision-app.mjs --name "Orbit Ledger" --slug orbit-ledger --accent violet`

Available starter accents: blue, violet, green, orange. A custom brand should define both light and dark accent palettes rather than derive dark mode from a single hex value.

## Verified web links

Pass `--link-host app.example.com` to configure the native iOS associated-domain and Android auto-verified HTTPS intent filter and to seed the Precision linking allowlist. This does **not** prove domain ownership: the deployment must still publish the Apple AASA and Android Digital Asset Links files. Omitting `--link-host` is intentionally safer than inventing a domain.
