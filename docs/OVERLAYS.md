# Gate 07 — Overlay Manager contract

Overlay behavior is centralized because popup placement, focus, layering, dismissal, scrolling, and safe-area collisions are too error-prone to reimplement per feature.

## Architecture

- `OverlayRootProvider` provides exclusive overlay lifecycle ownership and transient toast feedback.
- `Popover` measures a real native-backed anchor with `measureInWindow`, remains visually hidden until geometry is known, then uses the pure placement solver.
- The solver tries preferred placement, vertical flip, safe viewport clamping, then height/width constraints with internal scrolling.
- `Menu`, `Dialog`, and `BottomSheet` reuse the same lifecycle manager.
- `SelectField` is built on `Popover`/`Menu`; it does not own a second dropdown algorithm.

## Rules

1. Feature code may not use raw `Modal`, `measureInWindow`, `measureLayout`, or independent portal/floating-position libraries.
2. Only one exclusive interactive overlay may be active at once; opening another closes the previous overlay.
3. Escape/back closes safe overlays. Destructive alerts can disable backdrop and Escape dismissal and require explicit action. Dialogs and sheets trap keyboard focus while open, focus their first action/content target, and restore focus only when no newer overlay owns it. Trigger-unmount restoration is safely skipped.
4. Anchored surfaces account for viewport size, safe-area insets, margins, trigger geometry, content size, preferred placement, and vertical flip.
5. Constrained popovers scroll internally; the underlying page does not gain popup-related scroll or overflow.
6. Native `Modal` is used for blocking overlays to avoid arbitrary app z-index stacking. Root toasts use the centralized semantic layer token.
7. Gesture-driven sheet behavior is deferred to the motion/gesture gate; the current sheet already owns geometry, dismissal, safe area, focus trap, long-content scrolling, reduced-motion entry/exit, and modal semantics.

## Action-menu composition

Use `ActionMenu` for product command menus that need grouped actions, semantic menu ownership, shortcut hints, destructive separation, and automatic close-before-action behavior. Keep `Popover` + `MenuGroup` available for custom anchored content that is not a command menu.
