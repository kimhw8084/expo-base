# New-app generator

`@precision-calm/create-app` produces a new Expo application workspace that consumes the shared platform instead of copying component source.

## App generator and screen scaffolder

`create-precision-app` creates a new application. After generation, use the separate
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

`node packages/create-precision-app/bin/create-precision-app.mjs --name "Orbit Ledger" --slug orbit-ledger --accent violet`

Available starter accents: blue, violet, green, orange. A custom brand should define both light and dark accent palettes rather than derive dark mode from a single hex value.

## Optional capability profiles

The minimal output has no optional native capability dependencies. Use `--capabilities` only for
approved application needs, for example:

`node packages/create-precision-app/bin/create-precision-app.mjs --name "Orbit Ledger" --slug orbit-ledger --capabilities secure-storage,runtime-signals,media`

Available selections are `secure-storage`, `preferences`, `runtime-signals`, `sharing`, `media`,
`local-auth`, `notifications`, `updates`, `device`, `haptics`, and `observability`. The generator
writes `precision.capabilities.json`, registers selected adapters in `capabilities.ts`, adds only
their package/dependency/plugin requirements, and passes the registry through the runtime root.
Read [`RUNTIME_CAPABILITIES.md`](./RUNTIME_CAPABILITIES.md) before choosing a profile; product
routes never import the Expo modules directly.

## Verified web links

Pass `--link-host app.example.com` to configure the native iOS associated-domain and Android auto-verified HTTPS intent filter and to seed the Precision linking allowlist. This does **not** prove domain ownership: the deployment must still publish the Apple AASA and Android Digital Asset Links files. Omitting `--link-host` is intentionally safer than inventing a domain.

## Validation

`npm run test:generator` creates a fresh temporary application from the current generator, validates its TypeScript configuration, and removes the temporary output. `npm run runtime:verify` includes this check together with the runtime UI contracts and Expo Base Doctor.

## Golden development contract

Generated applications receive a small local `AGENTS.md` that forwards to the canonical workspace
agent contract, a `golden-architecture.config.json` scoped to that application's `app/` routes,
and `npm run check:golden-architecture`. Their README points to the workspace Golden Catalog and
machine-readable catalog. This intentionally propagates rules and discovery without copying the
reference application's documentation. Optional packages are installed only when explicitly
selected through the capability profile.

The runtime supplies session-scoped server-state registration. Generated `serverState.ts` shows
the entity/list key convention without inventing a backend or fake API; products attach those keys
to their own service-adapter loaders.

Before production use, replace the generated demo adapters with product implementations for services, authentication, session security, and linking. The generated app is a foundation, not a claim that those integrations are configured for a particular backend.
