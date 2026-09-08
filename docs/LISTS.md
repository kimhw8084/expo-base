# Gate 08 — Scroll and list infrastructure

Precision Calm separates **small in-page groups** from **scroll-owning datasets**.

- `StaticList` is for small groups inside an existing screen scroll owner and warns above 40 items in development.
- `ListScreen` owns the vertical `FlatList`, safe-area/content padding, refresh/end-reach behavior, empty/header/footer regions, and semantic inter-item gap.
- `SectionListScreen` owns grouped datasets and sticky section headers.

## Rules

1. Feature code may not instantiate raw `ScrollView`, `FlatList`, `SectionList`, `VirtualizedList`, or experimental `VirtualView` for normal product layouts.
2. A screen has one primary vertical scroll owner. A virtualized list screen is that owner; it must not be wrapped by `ScrollScreen`.
3. Stable item keys are mandatory; pure key validation detects duplicates and empty keys.
4. `StaticList` is intentionally bounded. Larger datasets move to virtualization rather than silently rendering hundreds of rows inside a `ScrollView`.
5. React Native's production `FlatList`/`SectionList` remain the baseline. Experimental `VirtualView` is excluded from the production template until it becomes stable.
6. Pagination sizes are normalized through shared contracts rather than arbitrary per-screen values.

## Production loading and empty states

`ListScreen` distinguishes initial loading from a genuine empty result through `loading` and `loadingComponent`, while `refreshing` continues to represent refresh of already-loaded data. Dense activity feeds should render row primitives rather than wrapping every virtualized item in an independent card.
