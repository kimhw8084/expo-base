# New-app generator

`@expo-base/create-app` produces an independent Expo product repository by default. The generated
root is an npm workspace containing the product contract, a manifest-derived vendored set of the
required `@expo-base/*` source packages, local Golden tooling, and the selected capability profile.
It can be moved outside this repository and installed without source-workspace paths.

## App generator and screen scaffolder

`create-expo-base-app` creates a new application. After generation, use the separate
[`screen scaffolder`](./SCREEN_SCAFFOLDING.md) for standard Golden routes; it is intentionally not
folded into the app-generator questionnaire.

## Contract

- generated applications own product routes and brand configuration only
- generated applications do not fork design-system components
- brand accents are explicit light/dark semantic palettes
- Expo/React Native versions are pinned to the platform-certified baseline
- the output starts with Expo Router, CNG-ready app config, Unistyles registration, locale fallback, keyboard/motion/overlay/query roots, deterministic query keys, and one adaptive golden layout
- backend integrations remain optional adapters

## Example

`node packages/create-expo-base-app/bin/create-expo-base-app.mjs --name "Orbit Ledger" --slug orbit-ledger --accent violet`

The generated directory is the product repository root. From that directory run:

```sh
npm install
npm run verify
```

The generator records provenance in `.expo-base/source.json` at generation time. It is descriptive
metadata only; Expo Base does not provide an updater, migration engine, destructive regeneration,
or automatic remote behavior.

## Explicit workspace/proving mode

Expo Base's reference and generator tests can retain the source-workspace layout with:

`node packages/create-expo-base-app/bin/create-expo-base-app.mjs --mode workspace --name "Orbit Ledger" --slug orbit-ledger`

This mode is intentionally not the product default. It emits the historical child-app contract,
which resolves packages, Golden checks, and scaffolding through the parent Expo Base workspace.

Available starter accents: blue, violet, green, orange. A custom brand should define both light and dark accent palettes rather than derive dark mode from a single hex value.

## Optional capability profiles

The minimal output has no optional native capability dependencies. Use `--capabilities` only for
approved application needs, for example:

`node packages/create-expo-base-app/bin/create-expo-base-app.mjs --name "Orbit Ledger" --slug orbit-ledger --capabilities secure-storage,runtime-signals,media`

Available selections are `secure-storage`, `preferences`, `runtime-signals`, `sharing`, `media`,
`local-auth`, `notifications`, `updates`, `device`, `haptics`, and `observability`. The generator
writes `expo-base.capabilities.json`, registers selected adapters in `capabilities.ts`, adds only
their package/dependency/plugin requirements, and passes the registry through the runtime root.
Read [`RUNTIME_CAPABILITIES.md`](./RUNTIME_CAPABILITIES.md) before choosing a profile; product
routes never import the Expo modules directly.

## Verified web links

Pass `--link-host app.example.com` to configure the native iOS associated-domain and Android auto-verified HTTPS intent filter and to seed the Expo Base linking allowlist. This does **not** prove domain ownership: the deployment must still publish the Apple AASA and Android Digital Asset Links files. Omitting `--link-host` is intentionally safer than inventing a domain.

## Validation

`npm run test:generator` creates a fresh temporary application from the current generator, validates its TypeScript configuration, and removes the temporary output. `npm run runtime:verify` includes this check together with the runtime UI contracts and Expo Base Doctor.

## Standalone Golden development contract

Generated repositories receive a concise local `AGENTS.md`, `README.md`, `golden-architecture.config.json`,
machine-readable Golden catalog/pattern registries, the catalog-referenced documentation closure,
and local scripts for `typecheck`, `check:golden-architecture`, `scaffold:screen`, and `verify`.
The Golden catalog is filtered to the actual vendored package set; optional capability owners travel
only when their profile is selected or a selected package transitively requires them. The local
check validates that generated repository rather than assuming a source-workspace package exists.

Use `npm run scaffold:screen -- --name customers --pattern data-workspace` for a standard route.
The local `AGENTS.md` defines product-owned routes, domain logic/models/copy, branding, service
adapters, and product integrations versus Expo Base-owned semantic UI/layout, navigation/auth/session,
server state, root capabilities, accessibility/responsiveness, overlays, and feedback.

The explicit workspace/proving mode continues to forward to the canonical workspace Golden
catalog and scripts for Expo Base's own reference/testing use.

The runtime supplies session-scoped server-state registration. Generated `serverState.ts` shows
the entity/list key convention without inventing a backend or fake API; products attach those keys
to their own service-adapter loaders.

Before production use, replace the generated demo adapters with product implementations for services, authentication, session security, and linking. The generated app is a foundation, not a claim that those integrations are configured for a particular backend.
