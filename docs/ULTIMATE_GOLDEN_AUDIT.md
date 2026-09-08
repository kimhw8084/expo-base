# Ultimate Golden Audit

This document is generated from the live checkout by `scripts/generate-ultimate-golden-audit.mjs`. The JSON artifact is authoritative for the inventory; historical phase documents retain their original measurements.

## Live inventory

| Measure | Current value |
| --- | ---: |
| Workspaces | 47 |
| Golden Catalog owners | 76 |
| Ownership records | 24 |
| Discovery challenges | 56 |
| Public facade symbols | 366 |
| Existing state owners | 28 |
| Existing visual baselines | 12 |
| Existing pseudo-covered routes | 13 |
| Owner-certification records | 14 |

## Layer decision

- **Golden Kernel:** low-dependency tokens, primitives, common UI, layouts, forms, navigation, overlays, feedback, data display, core visualization, i18n, accessibility, motion, and runtime boundaries.
- **Golden Modules:** advanced visualization and future analytics compositions that remain tree-shakeable and absent from minimal generated apps.
- **Optional adapters:** native pickers, specialist grids, maps, editors, GPU/realtime rendering, and specialist media engines.

## Candidate dispositions

- **owner certification — BUILD_KERNEL:** Stable owners need a machine-readable contract for state, responsive, semantic, theme, and touch coverage.
- **dependency graph — BUILD_KERNEL:** Acyclic package ownership and core/advanced separation are architectural invariants.
- **advanced visualization — BUILD_GOLDEN_MODULE:** Scatter, histogram, and heatmap mechanics are reusable but should not enter the minimal facade.
- **tooltip — RECIPE_ONLY:** Critical information cannot depend on hover; a universal touch-safe tooltip needs a separate interaction contract.
- **slider/range — RECIPE_ONLY:** No current cross-platform owner meets the complete keyboard/touch/native contract without a specialist adapter.
- **enterprise grid — OPTIONAL_ADAPTER:** Virtualization, pinned columns, formulas, and cell editing are specialist infrastructure.
- **maps/editor/realtime GPU — PRODUCT_SPECIFIC:** Low universal leverage and high dependency/platform cost.
- **native picker/safe area/VoiceOver — NATIVE_VALIDATION_REQUIRED:** Web and source contracts cannot prove physical device behavior.
- **help popover — RECIPE_ONLY:** Explicit help is already supported by the overlay contract without introducing a second positioning system.
- **split/button group/shortcut hint — RECIPE_ONLY:** Existing Button, ActionMenu, and shortcut composition cover the generic mechanics without a new public family.
- **tree/hierarchy view — OPTIONAL_ADAPTER:** Keyboard tree navigation and virtualization are valuable but materially more specialized than the core list/table contract.
- **attachment/file/media tiles — RECIPE_ONLY:** Presentation can be composed without owning upload transport, file permissions, or a new media hierarchy.
- **token input — RECIPE_ONLY:** The existing choice and multiselect contracts own the generic selection lifecycle.
- **file-picker field — OPTIONAL_ADAPTER:** The input needs platform capability selection and must not pull acquisition dependencies into the kernel.
- **analytics panels and dashboard compositions — RECIPE_ONLY:** The current product-neutral primitives compose these narratives while product meaning remains outside the kernel.
- **chart axes/formatters/data fallback — BUILD_KERNEL:** Scales, finite data, deterministic ticks, shared state anatomy, and accessible table fallback are common mechanics.
- **specialist statistical/financial chart families — OPTIONAL_ADAPTER:** Candlestick, box plot, funnel, cohort, and high-density composites should not inflate every app until real demand justifies them.
- **chart inspector/legend interaction — RECIPE_ONLY:** The core contract protects keyboard/touch selection and fallback; a universal inspector remains a deliberate future module boundary.
- **specialist media/editor/maps — PRODUCT_SPECIFIC:** These require domain, platform, or heavy rendering infrastructure that Golden Base should not own.

## Certification model

The convergence gates combine the existing Golden lanes with explicit owner certification and package dependency graph validation. Stable visual owners declare states, theme/density/viewports, localization, semantics, keyboard/touch, forced colors, large text, and baseline relevance. Nonvisual catalog items remain explicit exemptions rather than denominator manipulation.

Native runtime acceptance remains separate and unexecuted.
