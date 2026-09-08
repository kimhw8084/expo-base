# Expo Base Runtime RC3

Runtime RC3 turns the reference application from a collection of acceptance routes into a coherent adaptive product shell and makes production-like browser certification one command.

## Reference shell

Authenticated reference routes use the real Expo Base navigation system:

- Home
- Build — forms, navigation, overlays, lists
- Data — data display, visualization, feedback
- Patterns — golden layouts, pathological-content stress
- System — component lab, accessibility, services, linking, authentication, authorization

Compact and medium layouts expose the five destinations as bottom tabs. Expanded and wide layouts promote the same model into the persistent Expo Base sidebar. Public/auth-bootstrap routes bypass the shell without remounting a separate navigation implementation.

## Responsive refinement

- PageHeader remains stacked through medium widths and becomes horizontal only at the expanded regime.
- h1/h2/display typography steps down at compact widths without product-owned media queries.
- buttons are bounded to their owning container.
- desktop reference pages rely on persistent navigation while compact routes retain a safe Back fallback.
- selected navigation destinations preserve hierarchy during hover/focus.

## Production-like browser certification

`npm run runtime:test:web` now performs:

1. the complete runtime verification preflight;
2. Expo static web export;
3. a local static server for the exported files;
4. Playwright browser certification against the exported application;
5. automatic server teardown.

This deliberately certifies the static-render path that previously exposed the Unistyles initialization failure rather than testing only the development server.


## CI

`.github/workflows/runtime-web.yml` deliberately calls the same runtime commands used locally. It installs Node 22, installs the workspace, runs `runtime:verify`, installs Chromium/Firefox/WebKit, and runs `runtime:test:web` against the static Expo export. Browser reports are retained as CI artifacts on failures.
