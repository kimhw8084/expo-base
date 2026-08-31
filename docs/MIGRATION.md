# Existing-app migration

Precision Calm migrations should be executed as vertical slices, but only after auditing the existing codebase for platform violations and dependency drift.

## Audit

```bash
npm run migrate:audit -- --path /path/to/existing-app
npm run migrate:audit -- --path /path/to/existing-app --json
```

The auditor groups findings into four waves:

1. **Foundation replacement** — raw geometry, StyleSheet ownership, responsive branching, scroll ownership, dependency alignment.
2. **Interaction centralization** — router coupling, overlays, icons, animation, haptics.
3. **Data presentation** — centralized numeric/locale formatting and adaptive data views.
4. **Service decoupling** — direct backend SDK usage in feature UI moves behind adapters.

High-severity findings should be addressed before broad visual migration because they represent architecture that can undermine responsive or interaction consistency.

## Recommended vertical-slice migration

For each feature:

1. Preserve product behavior and data contracts.
2. Replace route shell/layout with Precision Calm primitives/patterns.
3. Move forms, lists, overlays and navigation to platform APIs.
4. Move service calls behind adapters if they currently live in UI modules.
5. Run contract gates and runtime certification.
6. Delete the replaced legacy UI instead of maintaining duplicate systems.

The audit CLI is diagnostic by default. CI can use `--fail-on high` to prevent new high-severity migration debt during an incremental conversion.
