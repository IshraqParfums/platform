# Home page — image shot list

The home page is a **buying page**. The first photographs a visitor sees are
product bottles (from the catalog) and collection tiles. Material still-lifes
are atmosphere, not the hero.

Do not generate or source a giant hero photograph. A type-first opening is
intentional: on a phone, a still-life before the headline is the wrong first
paint.

## What the page actually uses today

| Placement | Source | Notes |
|---|---|---|
| Shelf cards | Each product's `primaryImage` from the API | Real bottle shots. If a product has no image, the card shows the name on paper — not a stand-in rose or fruit. |
| Collection tiles | `web/lib/catalog/collection-art.ts` | Full-bleed, with environment intact. Darker than the shelf, because type sits on a gradient over the lower half. |
| Hero | none | Type only. Urdu line, headline, two CTAs. |
| Materials / house | none required | The drifting paper field is the atmosphere. |

## What to shoot next (when you are ready)

These are optional upgrades, not blockers.

### 1. Collection tiles — the one atmospheric set

Portrait, ~900 × 1200. **Full-bleed, environment intact.** One per collection
(Designer, Nostalgia, Limited Edition). Darker and more atmospheric than the
shelf, because cream type sits in a gradient on the lower half.

These currently fall back to existing product photography via
`web/lib/catalog/collection-art.ts`. Point that map at the new files once they
exist.

### 2. Product photography (already the shelf)

The shelf shows whatever is on the product. Consistent bottle scale, same
ground, warm key light. This is catalog work, not a home-page special.

### 3. Optional still-life (do not put this in the hero)

If you later want a material moment on the page (beside the palette strip, or
on a product page), shoot **cutouts on a transparent ground**:

- A preserved rose head
- Saffron threads
- A brass tray of rose and cardamom

Same treatment as before: one subject, raking warm light, no props that date
it. These files can live in `web/public/home/` when you have them. They are
not wired to the hero.

Four placeholders already sit in `web/public/home/` (rose, tray, guava, trunk).
They are the right *idea* for still-lifes and the wrong job for a homepage
hero. Keep them for later; the page no longer depends on them.
