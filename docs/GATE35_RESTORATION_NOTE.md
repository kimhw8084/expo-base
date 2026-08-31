# Gate 35 restoration / merge note

The active execution filesystem lost the physical Gate 21–33 source tree before Gate 34. The last recoverable complete checkpoint was Gate 20; Gate 34 was implemented as a focused patch on that restored tree.

Gate 35 is therefore also produced as a focused semantic patch on the restored Gate-20 + Gate-34 line. It must **not** be used to overwrite a newer tree containing Gates 21–33.

When merging Gate 35 into the newest source:

1. Preserve Gate 21–33 packages and runtime providers.
2. Add `@precision-calm/auth` and the auth runtime changes.
3. Merge `PrecisionRuntimeProvider` auth configuration with the existing Gate 21–33 provider props.
4. Feed Gate 33 `sessionSecurity.locked` into `usePrecisionAuthAccess({ locallyLocked })` and configure the `locked` route.
5. Preserve Gate 34 linking policy and add only the `onIncomingRoute` / shared return-intent channel integration.
6. Preserve newer Doctor, Storybook, performance, diagnostics, media, localization, privacy, connectivity, and secure-storage checks from Gates 21–33.
