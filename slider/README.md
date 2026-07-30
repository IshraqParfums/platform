# Perfume spray slider

A slider through the perfume collection where every bottle fires its atomiser as
it arrives — while you drag, when it settles, and whenever you press the cap.

Nothing is a bitmap. Each bottle is generated as an SVG from its theme, so the
silhouette, glass tint, liquid, cap material, collar and dip tube all change from
one perfume to the next. The mist is a canvas particle system tinted to the
perfume's accent.

## Look at it

Open `slider/perfume-slider.html` in a browser. No server, no install — it is a
single self-contained file.

## Where the code lives

The core is the single source of truth and lives with the rest of the frontend,
per `docs/05 - Engineering Standards.md` (UI belongs in `web/`):

```text
web/components/perfume-slider/
├── core/                 framework-agnostic, no React, no build step
│   ├── perfume-data.js   the collection + per-perfume theme
│   ├── bottle.js         SVG bottle generator + HTML label
│   ├── spray.js          canvas atomiser (droplet jet, mist, fallout)
│   ├── slider.js         DOM, drag/snap physics, spray choreography
│   ├── slider.css        all styling, scoped under .ipx-slider
│   └── index.d.ts        types for the TypeScript side
├── PerfumeSlider.tsx     React wrapper
└── index.ts

slider/
├── build.mjs             inlines core/ into the standalone file
├── perfume-slider.html   generated — do not edit by hand
└── README.md
```

Rebuild the standalone file after changing anything in `core/`:

```bash
node slider/build.mjs
```

## Using it in Next.js

Already wired up at `/collection` (`web/app/collection/page.tsx`):

```tsx
import { PerfumeSlider } from "@/components/perfume-slider";

<PerfumeSlider className="flex-1" />;
```

With callbacks and your own data — the component is a client component, so use
it from one:

```tsx
"use client";
import { useRef } from "react";
import { PerfumeSlider, type PerfumeSliderInstance } from "@/components/perfume-slider";

export function Collection({ perfumes }) {
  const slider = useRef<PerfumeSliderInstance>(null);

  return (
    <PerfumeSlider
      ref={slider}
      perfumes={perfumes}
      onChange={(p) => console.log("showing", p.id)}
      onSelect={(p) => router.push(`/products/${p.id}`)}
    />
  );
}
```

`ref` exposes `goTo(i)`, `next()`, `prev()`, `spray(power?)`, `setPerfumes(list)`
and `destroy()`.

Outside React:

```js
import { createPerfumeSlider } from "./core/slider.js";
const slider = createPerfumeSlider(el, { perfumes, onSelect });
```

## Props / options

| option | default | what it does |
|---|---|---|
| `perfumes` | built-in collection | the list to show |
| `index` | `0` | starting slide |
| `sprayOnChange` | `true` | spray when the active perfume changes |
| `autoplay` | `false` | advance on a timer |
| `autoplayDelay` | `5200` | ms between advances |
| `onChange` | — | active perfume changed |
| `onSpray` | — | atomiser fired |
| `onSelect` | — | the "Discover" button was pressed |

## Wiring it to the API

`perfume-data.js` is pure data. To drive the slider from the backend, map your
product records into the same shape and pass them as `perfumes` — the important
part is `theme`, which is what makes each bottle look like itself. `index.d.ts`
documents every field, and `PerfumeTheme` is deliberately small enough to store
per product:

```ts
theme: {
  accent, accentSoft, aura,        // colours: mist, fine detail, stage wash
  shape,                           // flacon | orb | obelisk | cylinder |
                                   // faceted | flask | teardrop
  glass, juice: [c1, c2, c3], fill,// the glass and what's in it
  cap, collar, label,              // hardware and label treatment
}
```

## Interaction

- **Drag** the stage, or flick it. It puffs at each bottle you cross and gives a
  full press when it lands.
- **Click the bottle** to press the atomiser.
- **Arrow keys / Home / End** to move, **Space / Enter** to spray.
- **Trackpad** horizontal scroll.
- Tick rail underneath jumps straight to a perfume.

## Notes

- Respects `prefers-reduced-motion`: no particles, no transition animation.
- The particle system stops itself when idle and when the tab is hidden, and is
  capped at 1800 particles.
- Fonts (Fraunces / Manrope / JetBrains Mono) are loaded by the standalone demo
  from Google Fonts and degrade to system serif / sans / mono. In the Next app
  they come from whatever the layout provides.
- One deliberate constraint: the bottle **label is HTML, not SVG `<text>`**.
  Chromium keeps a stale raster of SVG text inside a slide that has been
  transformed — the plate repaints, the glyphs do not — so labels came up blank
  on every bottle except the first one painted. See `renderLabel()` in
  `bottle.js`.
