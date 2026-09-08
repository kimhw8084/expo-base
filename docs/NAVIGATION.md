# Gate 06 — Navigation contract

Navigation is split into two layers for portability:

- `@precision-calm/navigation` owns adaptive navigation UI, tabs, breadcrumbs, destination anatomy, focus/hover/pressed states, and compact/expanded composition.
- `@precision-calm/navigation-router` is the only feature-facing adapter that knows Expo Router.

## Rules

1. Compact primary navigation is constrained to 3–5 core destinations.
2. The same destination model adapts into persistent sidebar navigation at expanded widths.
3. Feature routes do not import `expo-router` directly; `_layout.tsx` remains infrastructure and may configure the router stack.
4. Direct `@react-navigation/*` application imports are prohibited. Expo SDK 56+ routes application navigation APIs through Expo Router.
5. Long tab sets own horizontal scrolling locally; the page never gains horizontal overflow.
6. Active-route resolution uses the longest valid route-prefix match so nested detail routes select the correct parent destination.
7. Visual navigation remains independent of routing implementation, allowing a future router swap without rewriting navigation components.

## Constrained-height sidebars

Desktop sidebar chrome keeps brand and runtime/footer context stable while the navigation-item region scrolls independently. This prevents short desktop windows, split-screen layouts, and large text settings from clipping destinations below the fold.

## Navigation landmarks

Expanded sidebar navigation and compact bottom navigation expose a named `Primary navigation` landmark when a router adapter supplies destinations. On web each destination is a real link with an `href` and `aria-current="page"`; normal activation stays client-side while browser modifier-click and context-menu behavior remain native. On native the same owner remains a pressable destination. Generic in-place compact navigation intentionally omits `href` and uses a named tablist with roving focus instead. Only the responsive navigation mode that is visible participates in the accessibility tree.
