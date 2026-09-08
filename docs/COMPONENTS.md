# Shared component depth

Use shared controls when their interaction semantics recur across products. They own tokenized
geometry, density, focus, selected and disabled states; product routes supply labels, values, and
domain meaning.

## Disclosure and choice

- `Disclosure` owns one expandable region. Use it for progressively disclosed supporting content.
- `Accordion` composes multiple disclosures with controlled or uncontrolled single/multiple expansion.
- `SegmentedControl` owns a compact finite choice. Use `RadioGroup` when every option needs a
  persistent description; use `ComboboxField` for searchable or long option lists.
- `StepIndicator` presents known workflow progress. It is presentation only: `WizardLayout` owns
  navigation and validation between steps.

All four owners retain accessible names and expanded/selected state, recompose long labels, and
use existing focus and reduced-motion policy. Do not place task-critical information only in a
tooltip. A universal touch-safe Tooltip remains intentionally unshipped: the current modal
Popover is the wrong hover lifecycle, and noncritical help should use visible description text or
`Disclosure` until a non-modal cross-platform positioning owner is proven.

## Identity and status

- `Avatar` accepts provider-resolved media or deterministic initials and delegates loading/error
  geometry to `MediaFrame`. Products supply the person name and decide whether the image is
  meaningful or decorative.
- `AvatarGroup` owns logical overlap, size, max-visible behavior, overflow count, RTL, and one
  aggregate accessible label. Presence and collaboration rules remain product-owned.
- `StatusIndicator` pairs every semantic tone with visible label text and optional description;
  color is never the only status signal.

## Code, copy, and separators

`CodeBlock` owns selectable monospace content, bounded surfaces, and explicit wrap versus
horizontal-scroll behavior. It has an action slot but no syntax-highlighting or editor dependency.
Use optional `CopyableCode`, `CopyableValue`, or `CopyButton` from `@precision-calm/sharing/ui` when
the app selects clipboard capability. Sensitive values default to explicit reveal before copy.

`Divider` is the sanctioned full/inset horizontal or vertical separator. Prefer containing
surfaces and spacing when a line does not add structural meaning.

See the System Lab and Golden Plus breadth lab for normal, disabled, long-content, compact, RTL,
and dark-mode specimens.
