# Aoi Visual System

## Design Intent

Aoi is a video and content community frontend. The interface should feel light, readable, and creator-friendly. It can carry a small amount of playful anime community energy, but content clarity comes first.

Core mood:

- Clear aqua and blue-green as the main identity.
- Soft sakura pink as an accent for active states and highlights.
- White or near-black surfaces with low-tint shadows.
- Compact controls, stable grids, and readable metadata.
- Motion that feels responsive rather than decorative.

## Design Tokens

The first implementation should define tokens in CSS variables and map them into Material Web system tokens through the Aoi wrapper layer.

```css
:root {
  color-scheme: light;

  --aoi-accent-50: #22b8cf;
  --aoi-accent-60: #0f9fb7;
  --aoi-accent-40: #5ed3df;
  --aoi-accent-20: #c9f3f7;
  --aoi-accent-10: #e9fbfd;

  --aoi-secondary-50: #5b8def;
  --aoi-sakura-50: #f2709c;
  --aoi-sun-50: #f7b955;

  --aoi-bg: #fbfdff;
  --aoi-surface: rgba(255, 255, 255, 0.82);
  --aoi-surface-solid: #ffffff;
  --aoi-surface-muted: #f2f8fa;
  --aoi-border: rgba(24, 72, 84, 0.12);

  --aoi-text: #17262b;
  --aoi-text-muted: #60737b;
  --aoi-icon: #64757b;

  --aoi-focus: rgba(34, 184, 207, 0.32);
  --aoi-shadow-sm: 0 4px 12px rgba(19, 80, 96, 0.08);
  --aoi-shadow-md: 0 10px 28px rgba(19, 80, 96, 0.14);

  --aoi-radius-xs: 4px;
  --aoi-radius-sm: 6px;
  --aoi-radius-md: 8px;

  --aoi-rail-width: 56px;
  --aoi-mobile-nav-height: 56px;
  --aoi-motion-fast: 120ms;
  --aoi-motion-base: 220ms;
  --aoi-ease-out: cubic-bezier(.19, 1, .22, 1);
  --aoi-ease-press: cubic-bezier(.2, 0, .2, 1);
}

:root.dark {
  color-scheme: dark;

  --aoi-bg: #101719;
  --aoi-surface: rgba(22, 33, 36, 0.82);
  --aoi-surface-solid: #162124;
  --aoi-surface-muted: #1d2a2e;
  --aoi-border: rgba(192, 241, 248, 0.14);

  --aoi-text: #eefcff;
  --aoi-text-muted: #a1bac2;
  --aoi-icon: #a3bac1;

  --aoi-focus: rgba(94, 211, 223, 0.34);
  --aoi-shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.22);
  --aoi-shadow-md: 0 12px 32px rgba(0, 0, 0, 0.34);
}
```

## Typography

- Body: system-first stack, `Inter`, `Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`, sans-serif.
- Brand: `Montserrat`, `Inter`, system sans. Use heavier weights only in the brand band.
- Body size: 14px base for dense media UI.
- Card titles: 14px or 15px, weight 650, two-line clamp.
- Metadata: 12px, muted color, tabular numerals for duration and counts.
- Letter spacing: keep at `0`.

## Layout

- Desktop rail: fixed 56px left navigation.
- Desktop content padding: 24px to 5vw, with content max width around 1280px.
- Mobile top bar: 56px fixed header.
- Mobile bottom nav: 56px fixed, 4 primary destinations.
- Category strip: horizontal tabs, scrollable on mobile.
- Video grid:
  - Desktop: `repeat(auto-fill, minmax(224px, 1fr))`.
  - Mobile: `repeat(2, minmax(0, 1fr))`.
  - Cover: fixed 16:9 aspect ratio.
- Use 6px radius for cards, controls, and covers. Use 8px only for larger grouped surfaces.

## Core Components

### App Rail

- Icon-only navigation with tooltips in the real Nuxt implementation.
- Active state uses sakura accent fill over a pale aqua background.
- Settings remains pinned to the bottom on desktop.

### Mobile Navigation

- Four primary items: Home, Categories, Following, Search.
- Minimum touch target: 44px.
- Active label and icon use sakura accent.

### Brand Band

- Shows `Aoi` as the first viewport signal.
- Uses aqua geometric bands and thin line marks instead of decorative blobs.
- Supports compact stats such as "Beta", "Mock data", or "Nuxt 4 Frontend".

### Category Tabs

- Text tabs for content discovery.
- Active tab uses sakura text and a 2px underline.
- Mobile tabs scroll horizontally without hiding overflow content elsewhere.

### Announcement Strip

- One-line or two-line community/operations message.
- Acrylic surface, left info icon, concise copy.
- Links use accent color and underline on hover.

### Video Card

- 16:9 thumbnail or generated placeholder.
- Two-line title.
- Uploader, view count, duration, and published date.
- Hover on desktop: translate up 6px and apply medium shadow.
- Press: scale to 0.972.
- Focus: visible ring using `--aoi-focus`.

### Buttons and Inputs

- Use Aoi wrapper components backed by Material Web; pages should not use `md-*` elements directly.
- Primary action: aqua background with white text.
- Secondary action: transparent or muted surface.
- Search input should be rounded 6px, not pill-shaped, unless used as a compact icon control.

## Material Web Adapter Rules

- Aoi wraps Material Web rather than exposing it directly.
- Material default pill shapes are overridden to Aoi 4px/6px/8px radii.
- Material colors are driven by `--aoi-*` tokens through `--md-sys-*` variables.
- Icon slots use `AoiIcon`, backed by Nuxt Icon and the local Lucide collection.
- Wrapper components own all `md-*` tags, event normalization, loading states, and Vue `v-model` bridges.

## Motion

- Page entry: fade + translateY(-8px), 220ms.
- Card hover: translateY(-6px), 220ms.
- Press: scale(0.972), 120ms.
- Drawer: translate + slight scale, 260ms.
- Loading skeleton: subdued shimmer, disabled under reduced motion.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
  }
}
```

## Accessibility

- Keep text contrast at WCAG AA or better.
- Do not rely on color alone for selected states. Use icon fill, underline, or border changes.
- Preserve text selection in article, title, description, and comment areas.
- All icon buttons require accessible labels.
- Focus states must be visible on rail items, cards, tabs, buttons, and inputs.
- Mobile nav and rail items must remain keyboard reachable.
