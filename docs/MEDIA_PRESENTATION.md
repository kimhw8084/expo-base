# Media presentation

`MediaFrame` from `@precision-calm/ui` owns image/media display state: stable aspect geometry,
cover/contain fit, loading placeholder, error fallback, image accessibility, and decorative-media
semantics. It is a kernel UI owner and has no picker, camera, or native acquisition dependency.

```tsx
<MediaFrame
  source={{ uri: customer.avatarUrl }}
  alt={`${customer.name} profile image`}
  aspectRatio={1}
  fit="cover"
/>
```

Pass `decorative` only when adjacent content already conveys the image meaning. When source
dimensions are known, pass `aspectRatio` so loading and failure preserve page geometry. Products
may provide their own fallback content, but should not rebuild `loading ? spinner : Image` shells.

Acquisition remains separate: select a document, image, or camera asset through the selected
optional `@precision-calm/media` capability, then pass its product-owned URI/metadata to
`MediaFrame`. Uploads, remote storage, transformations, and image editing remain product-owned.

`Avatar` and `AvatarGroup` compose `MediaFrame` for identity presentation. They inherit stable
geometry, image fallback, and decorative-versus-labelled accessibility behavior. Presence and
social-domain rules remain separate status or product concerns.

The System Lab uses deterministic data-URI specimens for ready, loading, and error states; it does
not claim device camera or picker execution.
