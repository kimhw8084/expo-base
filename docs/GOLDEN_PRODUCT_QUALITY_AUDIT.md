# Expo Base Exhaustive Product Quality Audit

Date: 2026-09-07  
Repository: `/Users/haewonkim/home/development/expo-base`  
Mode: audit only; no product defect was fixed and no permanent baseline was updated.

## Audit verdict

**MATERIAL QUALITY DEFECTS FOUND**

Expo Base remains architecturally strong, visually coherent in its default states, and free of observed crashes. It is not yet visually and interactively finished. The audit found 10 major defects that affect compact layout, short-height action reachability, keyboard interaction, overlay semantics, combobox behavior, and data-table accessibility. Seventeen additional quality defects expose weaknesses in loading presentation, pseudo-localization coverage, long-content behavior, reference UX, optional-package isolation, and accessible chart/copy semantics.

The passing Golden gates are real evidence of broad health, but they currently certify a deliberately narrow set of settled states. They do not prove that composite widgets follow keyboard conventions, that an overlay remains usable in short-height geometry, that every modal has one semantic root, or that the reference application's broader specimens are themselves world-class.

## Scope and method

The live route tree, package implementations, permanent tests, and current static export were inspected. The audit then used temporary Playwright collectors and focused interaction probes against an isolated local static server.

- Routes discovered: **29** (28 concrete route entries plus the unknown-route direct-entry boundary)
- Routes reviewed: **29 / 29**
- Screenshots retained and inspected: **207**
- Viewport regimes: **7**, plus a 512x450 zoom-equivalent stress case
- Browser engines: **Chromium, Firefox, WebKit**
- Themes: **light and dark**
- Densities: **comfortable and compact**
- Locale/direction: **en-US/LTR and en-XB/RTL**
- Interaction observation records: **107**, spanning **51** distinct labels/scenarios
- Whole-page horizontal-overflow cases: **0**
- Native runtime execution: **none**

The complete machine-readable coverage record is in `docs/golden-product-quality-coverage.json`. Raw measurements and the screenshot atlas were generated under `test-results/golden-quality-atlas/` during the audit; those ignored outputs are not tracked.

## Authoritative route/state matrix

| Route | Surface | Major states and controls reviewed |
|---|---|---|
| `/` | Home/foundation dashboard | theme, density, locale, direction, motion, primitives, AdaptiveSplit, master/detail |
| `/data` | Data workspace | search, filters, sheet, sort, selection, mixed select-all, columns, table/card transform, pagination, empty |
| `/lists` | List lab | static/virtual/grouped content, loading, empty, long rows, selection, scrolling |
| `/forms` | Form lab | text/password/textarea, checkbox/radio, select/combobox/multi-select, validation, server errors, dirty/discard, arrays, OTP, reset |
| `/navigation` | Navigation lab | tabs, breadcrumbs, back/fallback, sidebar, bottom navigation, long labels, keyboard |
| `/overlays` | Overlay lab | action menu, popover, dialog, destructive alert, short/long sheet, toast, focus, Escape, backdrop, resize |
| `/feedback` | Feedback lab | loading, skeleton, empty, no-results, error, offline, permission, reconnect, maintenance, retry |
| `/visualization` | Visualization lab | line, area, bar, stacked bar, donut, sparkline, progress, selection, fallback data, loading/empty/error |
| `/system` | Component system lab | buttons, links, chips, segmented controls, disclosure/accordion, progress/status, cards, metadata, feedback |
| `/stress` | Resilience lab | long copy, large values, compact, dark, RTL, overflow and truncation |
| `/golden` | Canonical patterns | all 20 registered patterns and pattern traversal |
| `/golden-plus` | Plus breadth lab | avatars, status, copy/sensitive values, code, timeline, date/time/range, charts |
| `/workflows` | Workflow lab | activity, offline/reconnect, command launcher, search/no-results, wizard, import, completion |
| `/server-state` | Server-state lab | load, dedupe, refresh, stale retained data, refresh failure, retry, invalidation, optimistic rollback, scope reset |
| `/capabilities` | Capability lab | memory preferences/storage/sharing/signals/local auth/notifications/updates and normalized outcomes |
| `/accessibility-motion` | A11y/motion lab | headings, groups, live regions, hidden content, focus, reduced motion |
| `/auth-session` | Auth/session lab | signed-out/in, loading, error, protected transitions, sign-out |
| `/authorization` | Authorization lab | allowed/denied/capability/role states |
| `/session-security` | Session security lab | lock, unlock, expiry, protected state, late-commit behavior |
| `/linking` | Linking lab | internal/external policy, invalid input, fallback |
| `/services` | Service lab | loading, success, normalized error, retry |
| `/admin-demo` | Protected route | direct entry, authorization and fallback behavior |
| `/sign-in` | Auth route | credentials, focus order, submit and direct entry |
| `/unlock` | Unlock route | unlock action, session state and direct entry |
| `/session-loading` | System route | loading semantics and direct entry |
| `/session-error` | System route | error/recovery and direct entry |
| `/link-error` | Link fallback | invalid-link explanation and recovery |
| `/auth/callback` | Auth callback | callback state, direct entry and recovery |
| unknown route | Not-found boundary | static-export response, app shell and recovery navigation |

## Defect totals

| Severity | Count |
|---|---:|
| P0 — Critical | 0 |
| P1 — Major | 10 |
| P2 — Quality defect | 17 |
| P3 — Polish opportunity | 2 |
| **Total** | **29** |

All findings are `OPEN`. The canonical defect records, reproduction steps, evidence paths, likely owners, and recommended regression coverage are in `docs/golden-product-quality-defects.json`.

## Top defects

1. **GPQ-001 · P1 — AdaptiveSplit overlaps following content on compact phones.** The collapsed primary pane lets its content draw through the Inspector card and into the next section. Owner: `@precision-calm/layouts`. Impact: every compact split/workspace composition.
2. **GPQ-002 · P1 — Modal surfaces expose duplicate dialog roots.** Dialog, BottomSheet, command launcher, and derived workflows can present two `dialog`/`aria-modal` boundaries. Owner: `@precision-calm/overlays` plus RNW Modal integration.
3. **GPQ-003 · P1 — Destructive confirmation uses `alert`, not `alertdialog`.** It also retains the duplicate unnamed modal root. Owner: `Dialog kind=alert` and `FormDiscardDialog`.
4. **GPQ-004 · P1 — ActionMenu keyboard entry is broken.** Focus lands on the invisible backdrop, arrows do nothing, and all menuitems are tab stops. Owner: `Popover`/`Menu`/`ActionMenu`.
5. **GPQ-005 · P1 — Tabs, radios, and segmented controls do not implement composite keyboard navigation.** Arrow keys do not move or select; every item remains in sequential tab order. Owners: navigation/forms/components.
6. **GPQ-006 · P1 — Combobox declares menu semantics instead of listbox semantics.** No `listbox`, `option`, `aria-controls`, or active-descendant relationship exists. Owner: forms + overlay selectable-list ownership.
7. **GPQ-007 · P1 — Combobox loses focus after keyboard selection.** Selection succeeds, then focus falls to `BODY` in all three engines. Owner: forms/Popover lifecycle.
8. **GPQ-008 · P1 — Combobox popup collides with fixed bottom navigation.** At short height it is hidden by 18px and is visibly narrower than its anchor. Owner: Popover positioning/form presentation.
9. **GPQ-009 · P1 — FilterDrawer clips its primary action at short height.** The Apply action extends below the usable viewport in Chromium, Firefox, and WebKit. Owner: FilterDrawer/BottomSheet.
10. **GPQ-010 · P1 — AdaptiveDataTable has no table structure.** The desktop surface contains zero row/header/cell roles. Owner: `@precision-calm/data-display`.
11. **GPQ-011 · P2 — Desktop table headers become ambiguous fragments at 1024px.** Owner: AdaptiveDataTable sizing/priority.
12. **GPQ-014 · P2 — Skeleton geometry disappears on subtle surfaces.** The loading card reads as an empty panel. Owner: feedback/foundation semantic fills.
13. **GPQ-015 · P2 — Pseudo locale does not transform most route content.** Direction changes, but the intended long-copy stress largely never occurs. Owner: reference i18n stress integration.
14. **GPQ-018 · P2 — Client navigation flashes a blank content region.** The shell remains empty for roughly 0.3-0.6s before the destination appears. Owner: app route/loading composition.
15. **GPQ-024 · P2 — Optional Expo notifications code leaks into memory-only web usage.** It emits repeated warnings on essentially every route load. Owner: notifications package export boundary.
16. **GPQ-012 · P2 — Copy/reveal controls have indistinguishable accessible names.** Three different actions are all named `Copy`. Owner: CopyableValue/SensitiveValue.
17. **GPQ-013 · P2 — LiveRegion duplicates visible capability copy.** Owner: accessibility announcement contract/reference usage.
18. **GPQ-016 · P2 — CodeBlock is visually mangled under RTL.** JSON punctuation and indentation inherit RTL instead of using bidi isolation. Owner: CodeBlock.
19. **GPQ-019 · P2 — Long Button labels orphan their directional icon onto a second line.** Owner: Button/action composition.
20. **GPQ-027 · P2 — Unknown direct entries have no Precision fallback.** The static export returns a plain unstyled `Not found` dead end. Owner: reference/generator route boundary and hosting contract.

Other open defects cover a no-op duplicated Golden pattern action (`GPQ-017`), an internal enum leaked into feedback copy (`GPQ-020`), incomplete server-error summary lifecycle (`GPQ-021`), incomplete/duplicated chart accessibility (`GPQ-022`, `GPQ-023`), undiscoverable tab overflow (`GPQ-025`), silent ListRow truncation (`GPQ-026`), an upstream Firefox warning (`GPQ-028`), and overly sparse stacked loading/error specimens (`GPQ-029`).

## Shared-system findings

### Tokens and foundation

No systemic raw-token drift, dark-mode collapse, or page-level horizontal overflow was observed. Light/dark hierarchy is generally restrained and coherent. The significant foundation-level issue is semantic surface contrast: Skeleton uses the same subtle fill as a common containing surface and vanishes. Compact density is generally deliberate, but state panels and long-action composition do not always adapt proportionately.

### Components

Buttons remain clear in ordinary states, but label/accessory wrapping is not optically robust. SegmentedControl declares radio semantics without radio keyboard behavior. CodeBlock needs a first-class bidi policy. CopyableValue needs context-aware accessible action labels. ListRow's hard two-line truncation lacks a sanctioned complete-content path.

### Layouts

AdaptiveSplit has a true compact geometry failure, not a cosmetic issue. Short-height behavior is the other material layout weakness: the bottom sheet/filter workflow does not reserve a safe action region. Normal compact, tablet, wide, and landscape surfaces otherwise avoid global horizontal overflow and generally recompose cleanly.

### Forms

Basic validation, first-invalid focus, error summary after normal submit, OTP paste/backspace, and discard focus restoration work. The largest gaps are the combobox semantic/focus/popup contract, radio composite keyboard behavior, and the pre-submit server-error summary mismatch.

### Overlays

Standard dialog focus trapping and restoration work across all three engines. Popover collision recalculates after resize and Escape restores the action-menu trigger. Those positives coexist with duplicate dialog semantics, incorrect alertdialog semantics, broken ActionMenu entry/navigation, combobox focus loss, and short-height sheet clipping.

### Navigation

Sidebar and bottom-navigation active states remain coherent during normal navigation, and command launcher shortcuts work. Tabs and bottom navigation expose tablist semantics without the expected one-tab-stop/arrow model. Long tabs are horizontally scrollable but provide no visual cue that destinations are hidden. Client route loading can leave the shell visibly blank.

### Feedback

StateView has a coherent visual language and retained stale-data behavior is good. Skeleton contrast, duplicated visible LiveRegion copy, internal enum labels in the reference selector, and sparse fixed state geometry weaken the quality bar. Feedback copy remains correctly product-owned; these are presentation/lifecycle issues, not a demand for generic wording.

### Data

Search, filtering, selection, empty states, compact card transformation, pagination, and retained refresh-failure content all work. The expanded table lacks table semantics and compresses high-value headers too aggressively at a standard desktop width.

### Visualization and media

Media geometry, avatar fallback/grouping, chart loading/empty/error states, responsive sizing, and dark presentation are generally stable. Chart accessible tables are structurally incomplete, interactive data points are duplicated in the accessibility tree, and stacked state specimens are disproportionately empty in compact review contexts.

## UX findings

- The compact AdaptiveSplit specimen is visibly broken even though the page has no document overflow.
- Short-height combobox and filter workflows technically open but put content/actions beneath persistent navigation or viewport bounds.
- The Golden authentication specimen teaches an inert duplicate action, which is especially damaging because the reference app is the living specification.
- Route navigation gives no progress cue while content is unloaded, creating a perceived failure/flash even when navigation ultimately succeeds.
- Truncated table headers, tabs, and list rows remove meaning or discoverability without a recovery affordance.
- The capability lab repeats its own explanatory message, increasing noise in a screen intended to model clarity.
- The feedback lab exposes implementation vocabulary (`noResults`) rather than polished product language.
- Loading skeletons and oversized state slabs preserve space but do not communicate structure effectively.

## Responsive findings

### Compact 320/390

Global shell containment is strong and no permanent page-level horizontal scroll was detected. Material compact defects are AdaptiveSplit overlap, hidden tab destinations, long Button icon wrapping, silent row truncation, and ineffective pseudo-copy stress.

### Short height

This was the highest-risk regime. Combobox popups overlap fixed navigation, and FilterDrawer's Apply action extends below the viewport. Menu and dialog surfaces otherwise reposition or scroll acceptably.

### Tablet and desktop

Overall hierarchy, card widths, and shell composition are strong. At 1024px, however, AdaptiveDataTable keeps desktop presentation while reducing several headers to ambiguous fragments. Wide canonical patterns are calm, but the authentication pattern duplicates an action.

### Landscape

No global overflow or navigation collapse was observed on the sampled high-risk routes. Short vertical space remains the governing risk for sheet/action ownership.

### Zoom equivalent

The 512x450 stress cases did not produce permanent document-level horizontal overflow. This does not negate the localized overlay clipping and hidden controls found under short-height conditions.

### RTL and pseudo locale

Direction switching works and major navigation/action rows reverse logically. CodeBlock should not inherit RTL, and the pseudo locale is currently a weak stress signal because most reference copy remains untransformed. Thus an RTL/pseudo test can pass while long translated text was never exercised.

## Interaction findings

### Pointer

Primary buttons, filters, selection, disclosures, copying, sensitive reveal, overlays, and command launcher pointer paths generally work. The Golden authentication pattern contains a pointer-operable no-op action.

### Keyboard

Normal dialog focus trap/restoration, form invalid-submit focus, OTP paste/backspace, command launcher shortcut/search/Escape, and overlay Escape behavior work. ActionMenu, tabs, radio groups, segmented controls, and combobox restoration do not meet expected keyboard behavior.

### Async

Server-state stale retention, refresh failure, retry presentation, dedupe demonstrations, and optimistic rollback behave coherently. Route-level code/loading introduces a blank-shell transition. Server errors applied outside normal submit do not reliably reach the form summary.

### Overlay

Focus trap mechanics are stronger than semantics. Duplicate modal roots, wrong alert role, popover focus entry, bottom-nav collision, and short-sheet action clipping are the major problems.

### Data

Search/filter/selection/pagination paths work visually, but table semantics and header legibility are below the Golden bar. Chart fallback data has analogous semantic structure problems.

### Navigation

Destinations and active states are stable after settlement. Composite keyboard behavior, tab overflow discoverability, route-transition continuity, and unknown-route recovery remain open.

## Browser findings

### Chromium

All 29 route entries and the full viewport/theme/resilience atlas were reviewed in Chromium. All ten P1 defects were reproducible there. Two 404 resource errors came from the deliberate unknown-route probe, not an application crash.

### Firefox

High-risk overlays, combobox, data filter, command launcher, form validation, ActionMenu, tabs, radio groups, and segmented controls were repeated. The same semantic, keyboard, focus, and short-height geometry defects reproduced. Firefox additionally emitted five repeatable upstream unreachable-code warnings from generated Expo Router LinkPreview code.

### WebKit

The same focused high-risk matrix reproduced duplicate modal semantics, wrong alert role, ActionMenu/composite-widget keyboard gaps, combobox focus loss/collision, and FilterDrawer clipping. No WebKit-only crash or rejected promise was observed.

## Existing-test blind spots

| Defects | Why current behavior/visual gates pass | Permanent coverage needed |
|---|---|---|
| GPQ-001 | Whole-page overflow checks do not detect sibling overlap; permanent screenshots do not include the scrolled compact AdaptiveSplit boundary. | Rectangle-order/non-overlap assertion plus targeted compact screenshot. |
| GPQ-002, GPQ-003 | Current overlay tests find a dialog and validate focus, but do not assert that exactly one semantic modal root exists or that destructive modality is `alertdialog`. | Role-count and ARIA snapshot assertions for each modal kind. |
| GPQ-004, GPQ-005 | Existing tests activate controls but do not exercise composite arrow-key conventions or count tab stops. | Keyboard-only roving-focus matrix across engines and RTL. |
| GPQ-006, GPQ-007 | Combobox tests prove visible selection, not listbox relationships or post-selection focus. | Semantic snapshot and active-element assertions after every close path. |
| GPQ-008, GPQ-009 | Screenshots favor normal heights; functional tests can click before/without proving final controls remain inside the usable viewport. | Short-height geometry constraints including fixed navigation and safe-area bounds. |
| GPQ-010, GPQ-022 | Text remains readable to sighted automation, and broad accessibility snapshots do not include detailed data relationships. | Dedicated table/chart-fallback ARIA structures. |
| GPQ-011, GPQ-025, GPQ-026 | Truncation avoids horizontal overflow, so geometry gates treat it as success; snapshots do not judge whether meaning/discoverability was lost. | Content-preservation assertions and deliberate long-label review boards. |
| GPQ-012, GPQ-023 | Controls have non-empty names, but tests do not detect duplicate names in context. | Contextual uniqueness assertions within each composite surface. |
| GPQ-013 | Both copies are valid text nodes and semantic tests do not compare visible duplication. | Visible-text count paired with live-region semantic assertion. |
| GPQ-014 | The skeleton state is stable and therefore matches its baseline; pixel regression cannot decide that the approved baseline is visually blank. | Human-approved surface-contrast board and token contrast contract. |
| GPQ-015 | Tests assert `dir=rtl`/locale state, not that representative content passed through pseudo transformation. | Text-transformation/expansion assertions for high-risk copy categories. |
| GPQ-016 | RTL containment passes and no overflow occurs; code-specific bidi quality is not asserted. | Computed direction/bidi contract plus RTL code screenshot. |
| GPQ-017, GPQ-020 | Reference specimens are not checked for inert duplicate actions or developer-facing enum copy. | Canonical-pattern traversal and reference-content quality assertions. |
| GPQ-018 | Tests wait for the destination to settle, skipping intermediate route state. | Sample main-region continuity immediately after client navigation. |
| GPQ-019 | Button remains clickable and contained; no state board combines long pseudo labels with directional accessories. | Long-label/icon visual matrix at compact widths. |
| GPQ-021 | Normal invalid submit is tested and works; externally applied server errors before submit follow a different lifecycle. | Explicit pre/post-submit server-error scenarios. |
| GPQ-024, GPQ-028 | Current gates do not fail on browser console warnings, and package-export tests inspect symbols rather than module-evaluation side effects. | Classified console-cleanliness and optional-implementation leak tests. |
| GPQ-027 | Router tests exercise known fallback routes, while the static host's unknown direct-entry response is outside the current app-level suite. | Production-style static-host direct-entry contract. |
| GPQ-029 | Pixel baselines preserve the existing geometry exactly; they do not judge whether the geometry is proportionate or calm. | Human review rubric for density/context, not merely snapshot equality. |

## False-confidence risks

1. **Pixel stability is not design quality.** A blank-looking skeleton or awkwardly spacious error state can pass forever once accepted as a baseline.
2. **No page overflow does not mean no layout failure.** GPQ-001 overlaps siblings; GPQ-008 and GPQ-009 hide localized overlay content while the document width remains valid.
3. **A role existing does not mean semantics are coherent.** Duplicate dialogs and menu-backed comboboxes satisfy simple role lookups while presenting an incorrect tree.
4. **Click success does not certify keyboard interaction.** Every composite widget can activate by pointer while arrow navigation and roving focus remain absent.
5. **Waiting for settled routes hides transition defects.** The route ultimately renders, but users see an empty shell during the wait.
6. **RTL activation does not certify localization stress.** The document can be RTL while nearly all strings bypass pseudo expansion.
7. **A clean architecture import check does not prove optional code stays dormant.** The notifications implementation is legally exported yet still evaluates in memory-only web flows.
8. **Reference labs can normalize defects.** Because labs are used as both specification and test fixture, an awkward or inert specimen can be repeatedly certified rather than challenged.

## Positive evidence

The audit also confirmed important behavior that should be preserved during any future fix phase:

- No route crash, unhandled page exception, rejected promise, or persistent global horizontal overflow was observed.
- Standard dialog focus trap, Tab cycling, Escape dismissal, and trigger restoration work in Chromium, Firefox, and WebKit.
- Destructive alerts correctly resist Escape dismissal despite their semantic-role defect.
- Popovers recalculate position after viewport resize, close on Escape, and restore the ActionMenu trigger.
- Invalid form submission exposes an error summary and focuses Full name across all three engines.
- OTP full-code paste distributes digits correctly; Backspace clears the final digit without losing focus.
- Command launcher opens from both Meta+K and Control+K, focuses search, reports no results, and closes with Escape.
- Server-state refresh failure retains stale content, and optimistic rollback is demonstrable.
- Dark mode is generally intentionally designed; no systemic contrast or surface-hierarchy collapse was found.
- Major RTL navigation/action recomposition is structurally correct.

## Evidence and artifacts

- Defect ledger: `docs/golden-product-quality-defects.json` — **29 open items**
- Coverage manifest: `docs/golden-product-quality-coverage.json`
- Temporary review atlas: `test-results/golden-quality-atlas/` — **207 screenshots generated during the audit** plus geometry, interaction, semantic, RTL, transition, and console evidence

The atlas is ignored evidence, not a permanent regression baseline. No Golden visual snapshot was updated.

## Product-source changes

**NONE — audit only**

Only audit documentation and ignored audit evidence were created. No component, route, package, test, architecture rule, dependency, generator template, or permanent visual baseline was changed.

## Recommendation

**Does Expo Base require a dedicated quality-fix phase before the production template can be called visually and interactively finished? YES.**

The fix phase should address shared owners in dependency order: compact layout and overlay geometry; overlay/composite-widget semantics and keyboard behavior; data/chart semantics; then reference/stress fidelity and P2 visual polish. It should preserve the behaviors listed under Positive evidence and add the targeted regression checks described in the ledger. No fixes should be performed by editing or blindly accepting current visual baselines.

---

## Product Quality Fix Pass 1 remediation — 2026-09-07

Pass 1 resolved every P1 finding while preserving the original audit above as historical evidence. The defect ledger now records **10 P1 FIXED / 0 P1 OPEN**; the unrelated **17 P2** and **2 P3** findings remain open for a separately authorized polish pass.

### Shared-owner remediation

- `GPQ-001`: `AdaptiveSplit` now uses intrinsic compact flow rather than retaining expanded-pane flex-basis geometry. Rectangle-order regressions cover 320px, 390px, short-height, and landscape layouts.
- `GPQ-002` and `GPQ-003`: the overlay portal host is semantic-free, while `Dialog` is the sole named `dialog` or `alertdialog`. Destructive confirmation no longer adds a duplicate `alert`; modal role counts, naming, description, initial focus, Escape policy, scroll lock, and restoration are covered.
- `GPQ-004`: `ActionMenu` owns menu-item focus and roving keyboard traversal, skips disabled items, and restores its trigger. The backdrop is hidden and cannot receive focus.
- `GPQ-005`: Tabs, RadioGroup, SegmentedControl, and BottomNavigation now use owner-appropriate roving focus with arrow, Home, End, disabled-item, orientation, and RTL behavior. Bottom navigation remains navigation/tab semantics rather than becoming a radio group.
- `GPQ-006` and `GPQ-007`: Combobox now exposes combobox/listbox/option semantics with controlled/highlighted relationships and deliberately restores focus to its input after keyboard selection.
- `GPQ-008`: the shared popover owner constrains and scrolls popup content inside the usable viewport, accounts for fixed bottom navigation, matches its anchor where requested, and keeps highlighted options reachable.
- `GPQ-009`: `BottomSheet` now separates bounded scrolling content from a persistent footer; `FilterDrawer` uses that footer for Apply/Clear actions.
- `GPQ-010`: wide `AdaptiveDataTable` exposes table, row, column-header, cell, sort, and row-selection semantics. Its compact card/list transformation remains a deliberately different structure.

No P2 finding was marked fixed as collateral; Pass 1 did not broaden into P2 work.

### Blind spots closed

`tests/e2e/web/product-quality-p1.spec.ts` adds permanent geometry, semantic-root, keyboard-roving, focus-lifecycle, viewport-containment, and data-hierarchy assertions. It runs the interaction and semantic paths in Chromium, Firefox, and WebKit. Existing semantic certification now includes the corrected alert-dialog and table structures, and existing reference behavior checks use the corrected option roles. Source contracts also protect the overlay and accessibility ownership changes.

The original P1 reproduction matrix now passes **39/39** across the three browser engines. The final temporary review atlas at `test-results/p1-quality-review/` was generated with **14** settled-state screenshots spanning light/dark, comfortable/compact, compact/desktop/short-height, and RTL conditions. Review confirmed stacked split geometry, anchored bounded combobox presentation, reachable drawer actions, coherent dialog/alert hierarchy, data-table presentation, and composite-control layouts.

### Permanent visual baselines

Permanent snapshot changes were reviewed rather than accepted automatically:

- the data-table board changed by 2px after the corrected semantic row hierarchy and remained visually coherent;
- the destructive-confirmation image was recaptured under the corrected `alertdialog` selector with no unintended visual change.

Golden visual verification passes **10/10**.

### Pass 1 certification

- P1 focused browser matrix: **39/39 PASS** (13 Chromium, 13 Firefox, 13 WebKit)
- semantic/accessibility scenarios: **8/8 PASS**
- Golden browser aggregate: **19/19 PASS**
- full web behavior: **264/264 PASS**
- Golden architecture: **75 owners / 0 violations**
- Golden Catalog: **75 owners / 24 ownership records / 55 discovery challenges**
- Pattern registry: **20 patterns PASS**
- negative architecture fixtures: **13 PASS**
- repository validation: **208 required files PASS**
- package manifests: **46 workspaces PASS**
- public API and snapshot: **366 symbols / 16 packages PASS**
- architecture boundaries: **PASS**
- generator minimal and opt-in profiles: **PASS**
- runtime UI typecheck: **PASS**
- `runtime:verify`: **PASS**
- Doctor: **94 passed / 0 failed / 0 warnings**
- performance budgets: **PASS** (4,887,537-byte total JS; 3,404,056-byte largest chunk; 4,731,187-byte heaviest initial route; 59,923-byte largest lazy route; 27 split routes; 0.39ms representative data derivation)
- `git diff --check`: **PASS**

No native runtime acceptance was performed or claimed. The ignored review atlas was generated for owner inspection during the pass and is not tracked; temporary collector code and local static servers were removed.

---

## Product Quality Fix Pass 2 remediation — 2026-09-07

Pass 2 resolved every P2 finding while preserving the original audit and Pass 1 record above as historical evidence. The ledger now records **17 P2 FIXED / 0 P2 OPEN**, with all **10 P1** fixes still protected. The two P3 observations (`GPQ-028`, `GPQ-029`) remain open and were not pulled into this pass.

### Shared-owner remediation

- `GPQ-011`: `AdaptiveDataTable` now preserves complete two-line column labels at its expanded threshold and expresses sort direction with a compact icon plus `aria-sort`, avoiding ambiguous text fragments and body-column drift.
- `GPQ-012`: `CopyButton`, `CopyableValue`, `CopyableCode`, and sensitive reveal controls derive contextual lifecycle names such as “Copy Workspace identifier” and “Copied Workspace identifier.”
- `GPQ-013`: `LiveRegion` gained a visually-hidden announcement mode; capability results now have one visible status and one assistive-only announcement instead of duplicated visible copy.
- `GPQ-014`: Skeleton color is now a semantic light/dark feedback token that remains visible but restrained on default, subtle, and elevated surfaces.
- `GPQ-015`: representative reference headings, body copy, actions, labels, errors, menu items, feedback, and table headers now use the locale message path. Pseudo stress tests require meaningful transformed-copy coverage while preserving IDs, URLs, code, and numeric data.
- `GPQ-016`: technical `Text`, `CodeBlock`, and copyable technical values explicitly own LTR direction inside RTL prose while copied content remains unchanged.
- `GPQ-017`: the Golden authentication specimen exposes one operative pattern action; the duplicate inert Next action was removed.
- `GPQ-018`: route chunks are prefetched on navigation intent through the shared navigation owner, retaining route splitting without exposing an empty shell. The implementation avoids eagerly mounting or duplicating hidden route trees.
- `GPQ-019`: `Button` owns a single non-orphaning icon/label row, non-shrinking accessories, and a bounded multiline label region across compact, pseudo, and RTL layouts.
- `GPQ-020`: the feedback lab now presents human-readable “No results” copy instead of a developer enum identifier.
- `GPQ-021`: the RHF lifecycle applies server errors immediately, exposes a form summary before a local submit attempt, focuses the first mapped field, and clears lifecycle state on reset.
- `GPQ-022` and `GPQ-023`: chart fallback data now exposes static table/header/cell relationships, while the visual chart remains the sole interactive datum owner with selected/pressed semantics.
- `GPQ-024`: the notifications Expo implementation uses type-only and lazy runtime loading. Memory-only web paths no longer evaluate the native implementation or emit the Expo notification warning.
- `GPQ-025`: overflowing Tabs expose a continuation affordance and horizontally reveal keyboard-selected tabs without scrolling the document vertically.
- `GPQ-026`: `ListRow` owns an explicit truncate/wrap content policy and complete contextual accessible labeling; long-content surfaces can preserve the full title and subtitle without local geometry.
- `GPQ-027`: unknown static direct entries resolve to the themed Expo Router `+not-found` surface with main/heading semantics and safe Home recovery while retaining HTTP 404 status.

### Permanent defenses and blind spots closed

`tests/e2e/web/product-quality-p2.spec.ts` contributes **48/48 cross-browser checks**: 16 scenarios in Chromium, Firefox, and WebKit cover legible table headers, contextual names, live-region visibility, skeleton contrast, pseudo-copy thresholds, bidi isolation, route continuity, long-action geometry, immediate server errors, chart hierarchy, optional-module side effects, tab reveal, full-content list rows, and direct-entry recovery. Existing reference tests were corrected to assert the new non-duplicated chart controls and contextual copy names. The retained P1 matrix remains **39/39**.

The old source-format-only long-content checks were updated to recognize the semantic content policy and localized reference copy rather than requiring one exact JSX spelling. No production rule or behavioral expectation was weakened.

### Visual review

The final ignored Pass 2 review atlas at `test-results/p2-quality-review/` was generated with **23 screenshots** covering changed and sampled unaffected surfaces at 320, 390, 1024, and 1280 widths; short-height conditions; light/dark; comfortable/compact; pseudo LTR/RTL; and the unknown-route recovery state. Review confirmed complete table headings, visible dark/subtle skeletons, one visible capability result, coherent long-action anatomy, preserved technical bidi, expanded pseudo copy, static chart fallback tables, and styled recovery.

Two permanent images changed through the reviewed approval path:

- `workflow-compact.png`: records the intentional horizontal icon/label button anatomy.
- `stress-pseudo-rtl.png`: records genuinely transformed stress copy rather than direction-only pseudo mode.

Golden visual verification passes **10/10**; no unrelated baseline was updated.

### Pass 2 certification

- P2 focused browser matrix: **48/48 PASS** (16 Chromium, 16 Firefox, 16 WebKit)
- retained P1 browser matrix: **39/39 PASS**
- full static-export web behavior: **312/312 PASS**
- semantic/accessibility scenarios: **8/8 PASS**
- Golden visual regression: **10/10 PASS**
- Golden browser aggregate: **19/19 PASS**
- performance budgets: **PASS** (4,890,759-byte total JS; 3,345,655-byte largest chunk; 4,673,419-byte heaviest initial route; 60,206-byte largest lazy route; 28 split route chunks; 0.29ms representative data derivation)
- Golden architecture: **75 owners / 0 violations**
- Golden Catalog: **75 owners / 24 ownership records / 55 discovery challenges**
- Pattern registry: **20 patterns PASS**
- repository validation: **208 required files PASS**
- package manifests: **46 workspaces PASS**
- public API and snapshot: **366 symbols / 16 packages PASS**
- architecture boundaries, generator profiles, scaffold challenges, runtime UI typecheck, and `runtime:verify`: **PASS**
- Doctor: **94 passed / 0 failed / 0 warnings**
- `git diff --check`: **PASS**

The only browser-console allowlists remain narrow infrastructure noise: Playwright's process-level `NO_COLOR` notice and Firefox's known generated Expo Router unreachable-code warning. Product surfaces emit no repeatable notification/native-capability warning, console error, unhandled exception, or unhandled rejection. No native runtime acceptance was performed or claimed.
