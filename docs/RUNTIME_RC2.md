# Expo Base Runtime RC2

Runtime RC2 stays focused on real rendered behavior rather than new platform breadth.

## Added

- in-app reference theme modes: System / Light / Dark
- in-app Comfortable / Compact density switching wired through `PrecisionRuntimeProvider`
- semantic `Button` compact-only full-width behavior for mobile action layouts
- compact form actions stack vertically while desktop actions remain intrinsic
- dedicated 640px desktop bottom-sheet width token
- optional ListRow divider suppression for card-contained selection lists
- Playwright contracts for live theme/density switching and compact form-action geometry

These controls exist in the reference application so visual QA can reproduce theme/density states without changing operating-system settings or rebuilding the app.
