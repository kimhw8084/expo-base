# Screen scaffolding

The app generator creates a new Expo Base application. The screen scaffolder adds one sanctioned
Golden workflow to an existing generated application. They deliberately remain separate commands.

## Start a standard screen

```sh
npm run scaffold:screen -- --name customers --pattern data-workspace --protected
```

The command is non-interactive and therefore suitable for Codex and CI. Available scaffoldable
patterns are in [`golden.patterns.json`](../golden.patterns.json) and [Golden workflows](./GOLDEN_WORKFLOWS.md).

The scaffold creates only:

- protected/public route registration in `expo-base.routes.json` and `routes.ts`;
- a route composed from sanctioned owners;
- a neutral domain model and service-adapter TODO boundary;
- `.expo-base/task-effects.json` entries for consequential placeholders that still need a Product binding.

It never adds `fetch`, a backend SDK, fake records, route-local cache/retry state, raw geometry,
or a native capability dependency. Replace the explicit TODO model, service loader/mutation, copy,
and unique visualization before enabling the generated query.

Consequential actions without an honest local effect remain disabled and carry a source TODO. Review
`.expo-base/task-effects.json`, bind or explicitly qualify its unresolved entries before Product
launch, and run `npm run check:task-effects`. This editable contract supplements
`.expo-base/acceptance-obligations.json`; Doctor and acceptance guidance show unresolved entries
without turning foundation verification into a production-ready claim.

Each action records its stable key, registered route, Golden pattern, visible label, intended effect,
prohibited effects, recovery expectation, next action, and status. Resolved and qualified actions
must include a non-empty evidence reference.

## Capability-aware workflows

The app must already have the required optional capability profile. For example:

```sh
create-expo-base-app --name Acme --slug acme --capabilities media,runtime-signals
cd apps/acme
npm run scaffold:screen -- --name imports --pattern import-workflow
```

For Expo Base's explicit source-workspace proving mode, keep the app path and run the workspace
scaffolder from the source repository:

```sh
npm run scaffold:screen -- --app apps/acme --name customers --pattern data-workspace --protected
```

`import-workflow` requires `media`; `offline-workspace` requires `runtime-signals`. The scaffold
refuses instead of installing dependencies or registering a capability behind the app's back.

## Safety

The command validates pattern ID, kebab-case route name, selected capabilities, existing route
registration, and every destination before it writes. It refuses collisions and stages writes with
rollback, so a failed command leaves no partially registered route.

`expo-base.routes.json` is the source manifest for scaffolded routes. Do not edit it manually;
rerun the scaffold with a new name or make a conscious manual Golden composition for unusual work.

## Verify

```sh
npm run check:golden-architecture
npm run check:task-effects
npm run doctor -- --path apps/acme --fail
```

Doctor verifies scaffold route-manifest validity, route files, root protected-route consumption,
and task-effect record validity. Unresolved task effects appear as product-owned warnings.
