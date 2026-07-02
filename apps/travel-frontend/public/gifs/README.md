# Animated hero media (GIF / MP4-poster)

Drop animated `.gif` (or looping) assets here and reference them from a page's
`<PageHero>` via the `image` prop — it renders as a full-bleed background behind
the navy scrim, exactly like the static hero photos in `public/hero/`.

```vue
<PageHero
  :title="t('pages.packages.title')"
  image="/gifs/packages-loop.gif"
/>
```

Notes:
- Keep files optimized (< ~2 MB) — GIFs are large; prefer short, subtle loops.
- The hero already adds GSAP motion (entrance + a floating glyph), so heavy
  motion in the GIF isn't required.
- No branded GIFs were supplied, so pages currently use the `hero/*.png` photos
  and gradients. Replace `image="/hero/..."` with `image="/gifs/..."` to use a GIF.
