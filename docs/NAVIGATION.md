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
