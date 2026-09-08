# Golden certification

Expo Base separates structural, browser, and native evidence. A source contract or web test is never reported as native runtime acceptance.

## Commands

- `npm run golden:structural` validates the certification registry, Golden Catalog/patterns, architecture fixtures, repository/manifests, public API, boundaries, and generator.
- `npm run golden:visual` performs a fresh deterministic export and verifies reviewed Chromium baselines.
- `npm run golden:performance` performs a fresh export, enforces bundle/data budgets, and exercises representative runtime interactions.
- `npm run golden:verify` runs all Golden-specific structural, visual, semantic, accessibility-stress, and performance gates. Full cross-browser behavior remains `npm run runtime:test:web`.

`golden.certification.json` owns the public interaction-state matrix, visual scenarios, deterministic environment, route-level pseudo-copy coverage, performance budgets, and native validation policy.

`golden.owner-certification.json` is the owner-level state contract. It links stable visual catalog items to required states, themes, densities, responsive regimes, pseudo/RTL behavior, keyboard/touch behavior, forced-colors, large-text, and visual-baseline relevance. Every declared state resolves through `golden.evidence.json` to a typed fixture family and executable test evidence; materially distinct form, overlay, and chart interaction families have separate records. Nonvisual runtime, generator, recipe, capability, and native-only concerns remain explicit boundaries rather than untracked visual owners. `npm run check:owner-certification` and `npm run check:dependency-graph` are part of Golden structural certification.

The direct `/state-workbench` reference route renders deterministic fixtures for representative certified owners. It is a review and test surface, not a generated-app dependency or a Storybook replacement. The optional advanced visualization module has a separate ADR and CI lane; its route-scoped bundle is absent from the minimal generator profile.

## Visual policy

Fifteen high-information baselines cover component/form/data/feedback/overlay/core-visualization, advanced visualization, workflow, and the three flagship analytics/finance/monitoring compositions. Risk-selected scenarios combine light/dark, comfortable/compact, compact/wide, pseudo LTR/RTL, and reduced motion without multiplying every board across every dimension. The compact pseudo Visualization board protects local child containment, the advanced Golden Plus card protects optional analytical composition, and the flagship baselines protect production-like narrative composition. Chromium, UTC, `en-US`, CSS-pixel scale, disabled animation, deterministic local data, and static assets are the canonical pixel environment. Firefox and WebKit remain behavioral—not pixel—targets. Because system-font metrics differ between macOS development and Linux CI, the reviewed Chromium baselines are stored under explicit `darwin` and `linux` snapshot directories; both use the same strict diff policy.

Snapshot failure artifacts contain expected, actual, diff, trace, route, and scenario names. Review a failure as a design change first. Baselines may change only after inspecting those artifacts and deliberately running:

```sh
GOLDEN_VISUAL_APPROVAL=reviewed npm run golden:visual:update
```

Never update snapshots merely to make a failure green.

## Pseudo-localization adoption policy

Pseudo-localization is certified as route adoption, not merely as a working formatter. Each canonical
reference route declares at least four visible copy classes in `pseudoCoverage.routes`: the
`pseudoOwned` classes exercised by `useReferenceCopy`, explicit `intentionallyLiteral` technical or
product data, and any `developerOnly` strings. The structural check requires the classifications to
match the browser probes; the browser suite verifies transformed visible text for all canonical
routes in Chromium and representative pseudo-RTL routes in Chromium, Firefox, and WebKit. This
prevents a few transformed headings from falsely certifying an otherwise untranslated lab.

## Semantic and resilience policy

Selective ARIA snapshots protect page headings/landmarks, validation summaries, dialog/menu anatomy, data selection, and feedback state. Keyboard-only flows cover the command launcher, dialog/menu focus restoration, combobox operation, form validation, and data actions. Additional checks cover 200%-equivalent zoom, pseudo RTL, reduced motion, forced colors, long content, and compact geometry. `PrecisionWebAccessibilityStyles` installs shared focus-visible and forced-colors behavior in generated web document roots.

## Performance policy

Budgets detect regressions rather than impose speculative optimization. The static export uses Expo Router's installed production web async-routes support. Total JavaScript, largest chunk, heaviest initial route, largest lazy route chunk, split-route count, 10,000-record derivation, UI-settle time, and minimal-profile optional-dependency leakage are bounded in `golden.certification.json`. Cache persistence and optional native capability inclusion remain off for minimal generated apps.

## Native validation matrix

| Evidence | Current policy |
| --- | --- |
| Automated native source contracts | Required now: safe area, status bar, keyboard, back/close handling, orientation ownership, touch targets, theme bootstrap, optional capabilities |
| Web behavioral equivalence | Required now through Chromium, Firefox, and WebKit |
| iOS runtime acceptance | Required before release; not executed during the Golden program because the local destination is unavailable |
| Android runtime acceptance | Deferred/waived for 1.0 under PM Policy B unless PM changes policy |

Native runtime validation must later cover cold start, navigation, theme/density, Dynamic Type, safe area/orientation, keyboard/forms, overlays, VoiceOver/TalkBack, optional capabilities, and runtime logs. No current Golden result claims those scenarios ran.
