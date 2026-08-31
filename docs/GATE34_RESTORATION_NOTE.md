# Gate 34 restoration note

The active execution runtime did not retain the full working tree from the prior conversational Gates 21–33. The newest complete source checkpoint physically available in `/mnt/data` was Gate 20.

Gate 34 was therefore implemented and contract-tested on a restored Gate 20 workspace. The new Gate 34 modules are deliberately isolated so they can be merged into the newer logical source tree when that repository/checkpoint is available:

- `@precision-calm/linking` — pure policy, normalization, callback validation, safe-open runtime
- `@precision-calm/linking-expo` — Expo Linking bridge only
- runtime `usePrecisionLinking()` context
- `+native-intent` integration pattern
- generator/Doctor/migration/compatibility changes
- reference acceptance routes and linking documentation

Do **not** interpret this restored archive as containing the source implementations that were described for conversational Gates 21–33. Those later logical gates must be reconciled when the current upstream repository or a later complete source archive becomes available. Gate 34 should be merged semantically rather than replacing a newer tree wholesale.
