# Precision Calm Universal — Reference Specification v1.0

## Product constitution

Precision Calm Universal is a strongly constrained, adaptive, accessible, cross-platform Expo application platform.

### Non-negotiable qualities

1. Maximum UI/UX quality.
2. Portability across products, brands, backends, hosts, and Expo upgrades.
3. Versatility without permitting uncontrolled visual drift.
4. Excellent performance on native and web.
5. Semantic APIs over raw geometry.
6. True light and dark themes.
7. First-class phone, tablet, desktop, keyboard, touch, and accessibility behavior.
8. Automated enforcement for layout, styling, interaction, and architectural boundaries.

## Dependency direction

```text
Application -> Patterns -> Components -> Layouts -> Primitives -> Tokens
Application -> Adapters -> Backend implementation
```

Lower layers must never depend on product code or backend implementations.

## Layout contract

- 4px atomic grid; 8px primary rhythm.
- Feature code does not invent spacing, radius, elevation, z-index, or font sizes.
- One primary vertical scroll owner per normal screen.
- Horizontal page overflow is prohibited.
- Adaptive layouts change composition, not only scale.
- All potentially constrained action groups need an explicit overflow policy.

## Interaction contract

- Minimum default interactive target: 44 logical/CSS px.
- Every interactive component defines applicable rest, hover, focus-visible, pressed, selected, disabled, loading, and error states.
- Icon-only controls require accessible labels.
- Critical information is never toast-only or color-only.

## Overlay contract

Anchored overlays must use one positioning/layer system with collision detection, flip, viewport clamping, max-height, safe-area handling, focus restoration, Escape/outside-press policy, and deterministic z-order.

## Theme contract

Light and dark palettes are designed independently. Theme changes may alter visual tokens but must not alter spacing, dimensions, typography scale, or layout geometry.
