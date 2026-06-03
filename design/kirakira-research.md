# KIRAKIRA Research for Aoi

Research date: 2026-06-03  
Reference: https://kirakira.moe/

## Goal

This research extracts useful product, visual, and interaction patterns from KIRAKIRA☆DOUGA, then translates them into a safer direction for Aoi. The goal is inspiration and structural learning, not visual copying.

## Observed Product Shape

KIRAKIRA☆DOUGA presents itself as a lightweight douga style video community. The homepage prioritizes fast orientation:

- A persistent navigation surface for home, search, history, collections, following feed, upload, and settings.
- A top brand area with a strong logo and geometric identity marks.
- A horizontal category row for content discovery: home, animation, music, MAD, technology, design, games, general.
- A compact announcement area that invites users into the community.
- A latest-video grid with thumbnails, title, uploader, play count, duration, and date.

This is a good baseline for Aoi because it makes the product feel like a real community from the first screen rather than a generic template landing page.

## Layout Findings

### Desktop

- Uses a fixed 56px left rail with icon-only navigation.
- Main content is offset from the rail and uses generous page padding.
- Brand treatment occupies the first viewport top area, then content begins immediately below.
- Video cards are arranged in a responsive grid with roughly 226px minimum columns.
- The category tab row is visible on desktop and hidden on small mobile screens.

### Mobile

- Uses a compact top bar and bottom navigation.
- The reference site keeps a two-column video grid, but the captured mobile viewport showed right-side content truncation in some areas.
- Aoi should keep the two-column density but avoid horizontal overflow by using `minmax(0, 1fr)`, explicit `overflow-x: hidden`, and horizontally scrollable tabs.

## Visual Language

The reference visual system is bright, airy, and high contrast:

- Primary accent: saturated soft pink.
- Main surface: mostly white with subtle tinted shadows.
- Shape: compact 4px to 6px radius.
- Logo: large brand text with geometric decorations.
- Background: optional wallpaper image with accent-color overlay and low opacity.
- Typography: broad multilingual font stack with Montserrat used for brand moments.
- Cards: understated by default, acrylic-like hover surface, and lifted shadow on hover.

For Aoi, the reusable idea is not "pink douga". It is a tokenized, expressive, creator-community interface with small but polished motion.

## Interaction Findings

The inspected HTML and CSS showed several useful mechanics:

- Theme tokens are built around `--accent-*` color scales and light/dark variable sets.
- Buttons use clear hover, focus, disabled, and active states.
- Card hover lifts content about 6px and adds a soft shadow.
- Active press feedback uses a slight scale down.
- The side drawer transitions by scaling and offsetting the viewport.
- Page elements use short "float down" entrance animation.
- Custom scrollbars are hidden until interaction.

Aoi should retain the motion grammar, but make it more restrained and accessibility-aware.

## What Aoi Should Borrow

- Persistent navigation that adapts from desktop rail to mobile bottom nav.
- Category-first browsing for a media community.
- A slim announcement strip for operational and community messages.
- Video cards with a stable 16:9 cover, two-line title, and compact metadata.
- Theme variables for accent, surfaces, text, shadows, and motion.
- Light acrylic surfaces, modest shadows, and clear focus rings.
- i18n readiness and future API separation.

## What Aoi Should Avoid

- Do not inherit the reference site's pink brand as-is. Aoi needs its own aqua-blue identity with a small pink accent.
- Do not blur thumbnails so heavily that content becomes hard to identify.
- Do not globally disable user text selection.
- Do not hide mobile category navigation entirely. Aoi should keep a horizontal scroll strip.
- Do not allow the mobile grid to overflow horizontally.
- Do not expose Material Web directly to business pages. If used as the low-level foundation, keep it behind Aoi wrapper components because the package is in maintenance mode.

## Aoi Design Translation

Aoi should become a calmer, sharper media community:

- Brand mood: clear water, evening cyan, soft sakura accent.
- Interface mood: readable, fast, creator-friendly, lightly playful.
- Desktop first screen: left app rail, compact brand band, category strip, announcement, video grid.
- Mobile first screen: top brand bar, horizontal categories, announcement, two-column grid, bottom nav.
- Motion: quick and tactile, with `prefers-reduced-motion` support.
- Component system: Aoi wrapper components backed by Material Web and styled through Aoi tokens.

## Sources

- KIRAKIRA☆DOUGA homepage: https://kirakira.moe/
- Nuxt 4 documentation: https://nuxt.com/docs/4.x
- Nuxt Icon module: https://nuxt.com/modules/icon
- Nuxt i18n module: https://nuxt.com/modules/i18n
- Material Web maintenance note: https://github.com/material-components/material-web/discussions/5642
