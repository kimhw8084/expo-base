# Gate 36 restoration / merge note

Gate 36 was implemented on top of the physically recoverable **Gate 35 restored checkpoint**.

The wider conversation had previously developed Gates 21–33, but those later source files were not physically present in the active filesystem after the source-continuity incident documented for Gate 34/35. Therefore this restored workspace must **not** be used to overwrite a newer upstream tree that still contains Gates 21–33.

Use `precision-calm-universal-gate36-patch.zip` as the semantic merge source when applying Gate 36 to the newest upstream codebase. The patch contains only files added or changed relative to the Gate 35 restored checkpoint, plus its manifest.

Gate 36 adds semantic capability/entitlement authorization, nested authenticated capability guards, authorization adapters/runtime, tests, Doctor/generator/migration integration, documentation, and updated reference acceptance flows.
