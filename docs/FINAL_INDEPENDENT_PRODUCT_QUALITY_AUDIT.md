# Final Independent Product Quality Re-Audit

Date: 2026-09-07  
Repository: `/Users/haewonkim/home/development/expo-base`  
Mode: audit only; no product fixes, baseline updates, native execution, or release operations

## Findings lock

The independent route inventory, screenshot review, interaction review, severities, and six fresh
findings below were locked before the historical Golden product-quality audit, historical defect
ledger, remediation summaries, review atlases, old screenshots, or Git history were consulted.
The fresh ledger is `docs/final-independent-product-quality-defects.json`; its IDs and severities
must not be rewritten during the later historical comparison.

## Independent verdict

**MATERIAL DEFECTS STILL FOUND**

The current product is architecturally strong and most high-risk interaction systems behaved well,
but four P2 defects remain. Two are visible compact/localization failures, one makes pseudo-locale
certification materially incomplete, and one gives desktop route navigation the wrong web semantic
and browser-interaction model. Two additional P3 findings concern chart-state composition and an
upstream Firefox bundle warning.

## Coverage

- 29 user-visible routes discovered and all 29 route definitions reviewed.
- 27 intended surfaces rendered interactively. `/session-loading` and `/session-error` could not be
  held because the deterministic memory adapter resolves to healthy state immediately; their source
  and static bootstrap output were reviewed instead.
- 293 fresh screenshots inspected through route/state contact sheets and individual evidence review.
- Width regimes: 320, 390, short 390x520, landscape 844x390, tablet 768, transitional 1024, and wide
  1440.
- Light and dark themes; comfortable and compact density.
- Pseudo LTR and pseudo RTL across ten high-value routes, plus 320px localization pressure.
- Chromium received the full visual/interaction matrix. Eleven high-risk interaction families were
  repeated in Firefox and WebKit.

The exact manifest is `docs/final-independent-product-quality-coverage.json`.

## Fresh defects

| ID | Severity | Finding | Highest likely owner |
| --- | --- | --- | --- |
| FIQ-001 | P2 | The compact Visualization card header clips its explanatory sentence outside the viewport; pseudo copy worsens it. | Visualization reference composition / responsive header owner |
| FIQ-002 | P2 | Pseudo-localized bottom-navigation labels collapse into ambiguous ellipsized fragments at 320/390px. | `BottomNavigation` / `NavigationItemButton` |
| FIQ-003 | P2 | Pseudo-locale coverage is inconsistent: Navigation and Feedback transform none of their main copy, Home only about 6%, and several major labs remain partly literal. | `ReferenceCopy` adoption and reference route composition |
| FIQ-004 | P2 | Desktop primary route destinations are five buttons and zero links, losing correct web destination semantics and native link behaviors. | `RouterNavigationShell` / `SidebarNavigation` |
| FIQ-005 | P3 | Async chart loading/error specimens reserve excessive empty frame height. | Visualization reference composition |
| FIQ-006 | P3 | Firefox repeatedly warns about unreachable code in the generated Expo Router web bundle. | Upstream generated router/Metro dependency code |

No P0 or P1 defect was found.

## Shared-system assessment

- Foundation: visual tokens, surfaces, radii, typography, focus rings, compact density, and dark-mode
  hierarchy were coherent across the reviewed matrix. No material foundation drift was found.
- Components: buttons, selection controls, disclosure, identity/status, copy/reveal, media, and
  technical content remained visually consistent. The compact navigation label policy is the one
  shared component-level visual defect.
- Layout: page widths, stacked transformations, `AdaptiveSplit`, sticky actions, and constrained
  overlays held. The clipped Visualization header is a reference composition that bypasses an
  adaptive header/action pattern.
- Navigation: active state, arrow/Home/End behavior, route continuity, protected transitions, and
  404 recovery worked. Desktop route destinations nevertheless expose action buttons rather than
  links.
- Overlays: one modal root, focus entry/restoration, menu traversal, dialog/alert anatomy, short
  sheets, filter drawers, resize collision handling, and route-change cleanup behaved correctly.
- Forms: validation summary, first-invalid focus, server errors, discard focus, combobox final
  focus, radio navigation, OTP entry, and portable date/copy examples behaved correctly.
- Feedback/server state: visible loading/error/offline/reconnect states were coherent; retained
  content and refresh behavior did not flash blank. No material state-lifecycle defect was found.
- Data: wide table semantics, compact transformation, sorting, selection, pagination, long rows,
  and constrained layouts remained usable.
- Media/visualization: media, avatars, timeline, code, chart fallbacks, and chart selection were
  coherent. The compact chart header clips copy, and the reference async-state board is too sparse.
- Capabilities/runtime: deterministic fake capability UI did not claim device execution and emitted
  no Expo Base warning. Firefox alone emitted the generated-bundle warning in FIQ-006.
- Reference composition: generally polished, with the material pseudo-copy coverage gap and the two
  Visualization composition findings called out above.

## Visual quality

Spacing, radii, border hierarchy, typography, focus treatment, and color are notably consistent.
Dark mode looks designed rather than inverted; compact mode reduces rhythm without collapsing
targets; wide layouts respect readable maximum widths. The remaining visual problems are local but
real: the compact chart-card header loses content, localized primary navigation becomes ambiguous,
and the chart-state specimen spends too much vertical space on minimal content.

## Interaction quality

Pointer, keyboard, focus, overlay, form, data, auth/session, async, and route-transition behavior
was strong in the exercised flows. Action menus focused enabled items and restored triggers;
comboboxes retained focus after selection and stayed in-bounds after resize; short-height sheet and
drawer actions remained reachable; invalid forms focused the first field; route changes removed
open overlays; and sampled client transitions never showed a blank shell. The principal interaction
defect is semantic/browser-native: desktop destinations cannot behave as links.

## Responsive and localization quality

- 320/390: core cards, forms, data, overlays, and sticky actions recompose well. FIQ-001 and FIQ-002
  are the material exceptions.
- Short height: settled menu, combobox, long sheet, and filter drawer geometry remained bounded and
  internally scrollable.
- Landscape/tablet/1024: no material clipping or unusable transitional composition was found.
- 1440: readable maximum widths and sidebar hierarchy prevent uncontrolled stretching.
- Zoom/large-content equivalents: stress routes did not create page-level horizontal overflow, but
  the local Visualization header containment failure remains.
- Pseudo: the transformed routes expose useful pressure, but FIQ-003 means coverage is not broad
  enough to certify all major labs.
- RTL: navigation order, directional icons, overlays, tables, charts, timeline, avatars, and actions
  remained coherent. `CodeBlock` and technical identifiers stayed deliberately LTR/bidi-isolated.

## Browser and console quality

- Chromium: no Expo Base exception, React warning, unhandled rejection, or navigation warning was
  observed. Intentional 404 direct-entry probes produced expected resource errors.
- Firefox: interactions matched Chromium, but every tested route emitted FIQ-006 from generated
  bundle code.
- WebKit: high-risk focus, overlay, combobox, navigation, data, and unknown-route flows matched
  Chromium after settled-state timing. Intentional unknown-route probes produced expected 404 noise.

## Existing-gate blind spots

- FIQ-001: permanent screenshots do not include this specific compact card header, and generic
  document-overflow checks cannot detect a local child extending past its card/viewport.
- FIQ-002: semantic tests correctly see full accessible names, while visual baselines do not cover
  320px pseudo-localized bottom navigation; neither evaluates whether visible truncation preserves
  meaningful destination identity.
- FIQ-003: locale tests prove that pseudo transformation works where `t` is used, but do not measure
  adoption across representative visible reference copy. A green pseudo screenshot can contain a
  mostly untranslated screen.
- FIQ-004: keyboard and active-state tests certify the current button implementation. They do not
  ask whether route destinations expose link semantics, hrefs, or browser-native link operations.

The P3 findings are human-review/console-quality residuals rather than Golden blockers: FIQ-005 is
stable visual output whose composition was never judged for information density, and FIQ-006 is
outside Chromium pixel certification and appears to originate in generated dependency code.

## False-confidence risks

- Screenshot equality proves stability, not that the chosen baseline is attractive or complete.
- No page-level overflow does not catch locally clipped descendants.
- Full accessible names do not guarantee readable visible labels.
- Presence of roles does not prove the role is the right interaction model for a route destination.
- A working pseudo-localizer does not prove that visible product/reference copy uses it.
- Settled route assertions can miss intermediate frames; this audit sampled them separately.
- Test counts, API snapshots, and architecture ownership say nothing about optical hierarchy.
- Source/web checks still cannot prove physical-device focus, screen-reader, keyboard, safe-area, or
  touch ergonomics.

## Historical comparison

This comparison was performed only after the fresh ledger and severities were locked. The historical
documents did not change the independent findings.

- **Old regression / incomplete closure:** FIQ-003 independently overlaps historical GPQ-015.
  The prior remediation added threshold coverage to seven selected routes, and that work is visibly
  present. The final audit nevertheless measured zero transformed main-surface copy on Navigation
  and Feedback, about 6% on Home, and only partial transformation across several supposedly
  representative labs. The prior fix improved the condition but its test threshold permits a
  pseudo-locale gate to pass while substantial canonical copy remains unstressed.
- **Genuinely new P2 findings:** FIQ-001 (compact Visualization header clipping), FIQ-002
  (localized bottom-navigation label ambiguity), and FIQ-004 (button semantics for desktop route
  destinations) have no equivalent entry in the historical 29-item ledger.
- **Known minor residuals:** FIQ-005 independently matches GPQ-029, and FIQ-006 independently
  matches GPQ-028. Both were intentionally left open as P3 observations after Pass 2.
- **No-regression evidence:** none of the ten historical P1 failures was reproduced. The audit also
  independently confirmed corrected table header/structure, contextual copy names, hidden live
  announcements, skeleton visibility, technical LTR isolation, retained route content, coherent
  long-action icon composition, dormant memory notification behavior, tabs overflow affordance,
  long-row access, form server-error focus, chart fallback semantics, and styled unknown-route
  recovery. Of 27 historical P1/P2 findings, 26 were not independently rediscovered; GPQ-015 is the
  sole material historical overlap.

## Artifacts

- Independent report: `docs/FINAL_INDEPENDENT_PRODUCT_QUALITY_AUDIT.md`
- Fresh ledger: `docs/final-independent-product-quality-defects.json` (6 findings)
- Coverage: `docs/final-independent-product-quality-coverage.json`
- Ignored atlas generated during the audit: `test-results/final-independent-quality-audit/` (293 screenshots, 12 contact sheets); the output is not tracked.

Product/source changes: **NONE — audit only**.

Native runtime acceptance was not performed.

## Pass 3 remediation appendix

This appendix records remediation after the independent findings lock. It does not alter the
original audit verdict, severities, evidence, or independence record above.

| Finding | Shared root cause | Remediation | Permanent protection |
| --- | --- | --- | --- |
| FIQ-001 | The Visualization specimen bypassed responsive header composition with a fixed `HStack`. | It now uses the shared `SectionHeader`, which stacks its copy/accessory in compact regimes. | 320/390px pseudo LTR/RTL containment assertions across Chromium, Firefox, and WebKit plus the reviewed `visualization-compact-pseudo` baseline. |
| FIQ-002 | Primary compact destination labels had a one-line policy in five equal columns. | `BottomNavigation`/`NavigationItemButton` now own a bounded three-line visible-label policy instead of ellipsizing destination identity. | 320/390px pseudo LTR/RTL label geometry across all three browsers and the reviewed pseudo RTL stress baseline. |
| FIQ-003 | Pseudo-localization proved formatter behavior, not route adoption. | Thirteen canonical reference surfaces now declare pseudo-owned copy classes, intentional literals, and developer-only copy; representative visible copy uses `useReferenceCopy`. | Structural classification validation, full Chromium route probes, and representative pseudo-RTL browser parity probes. |
| FIQ-004 | The router adapter removed `href` before the navigation primitive rendered. | Router-backed destinations now render as web anchors with `href`/`aria-current` and preserve unmodified browser link behavior; native keeps the shared pressable destination. | Cross-browser href/link/current-state, keyboard activation, and non-intercepted Ctrl/Meta-click tests; navigation contracts distinguish route links from generic in-place tabs. |

The original P3 dispositions remain unchanged: FIQ-005 (sparse async chart specimens) is deferred
minor polish, and FIQ-006 is the documented upstream generated Firefox warning. See the historical
findings ledger for root cause, regression coverage, and reviewed Pass 3 evidence paths.
