/**
 * Bottle renderer.
 *
 * Builds an inline SVG for one perfume. Everything is drawn from the theme —
 * silhouette, glass tint, liquid gradient, cap material, collar metal and the
 * dip tube — so no two bottles in the collection look alike.
 *
 * Co-ordinate system: 220 x 340, bottle standing on y = 306.
 */

import { esc } from "./util.js";

const GROUND = 306;
const MID = 110;
/**
 * Where an attar rod ends.
 *
 * The wand hangs from the cap at y=126 down to here, so this is what sets its
 * length — and a withdrawn rod has to look like a rod, which means long. It
 * also has to reach the oil, which sits between y=186 and y=210 across the
 * collection.
 *
 * The lift that draws it out lives in slider.css and is tied to this: the tip
 * has to arrive at the neck mouth, so lift = ROD_TIP - 126. Change one and the
 * other has to move with it.
 */
const ROD_TIP = 244;

/**
 * Silhouettes.
 *   top    where the shoulder meets the neck; sets the liquid level.
 *   l / r  body extents at mid-height. Highlights and the label are placed
 *          from these, so narrow bottles don't lose their glasswork.
 * @type {Record<string, {d: string, top: number, l: number, r: number, facets?: string[]}>}
 */
const SHAPES = {
  flacon: {
    top: 152,
    l: 56,
    r: 164,
    d: `M 56 292 L 56 200 C 56 176 70 160 94 152 L 126 152
        C 150 160 164 176 164 200 L 164 292 Q 164 306 150 306
        L 70 306 Q 56 306 56 292 Z`,
  },
  orb: {
    top: 154,
    l: 42,
    r: 178,
    d: `M 96 154 C 58 166 42 202 42 236 C 42 268 60 292 86 302
        L 134 302 C 160 292 178 268 178 236 C 178 202 162 166 124 154 Z`,
  },
  obelisk: {
    top: 152,
    l: 62,
    r: 158,
    d: `M 56 300 L 70 188 C 72 170 82 158 96 152 L 124 152
        C 138 158 148 170 150 188 L 164 300 Q 165 306 158 306
        L 62 306 Q 55 306 56 300 Z`,
    facets: ["M 110 152 L 110 306", "M 84 162 L 74 306", "M 136 162 L 146 306"],
  },
  cylinder: {
    top: 154,
    l: 76,
    r: 144,
    d: `M 76 300 L 76 180 C 76 167 84 158 96 154 L 124 154
        C 136 158 144 167 144 180 L 144 300 Q 144 306 138 306
        L 82 306 Q 76 306 76 300 Z`,
  },
  faceted: {
    top: 154,
    l: 56,
    r: 164,
    d: `M 56 192 L 92 154 L 128 154 L 164 192 L 164 288
        Q 164 306 146 306 L 74 306 Q 56 306 56 288 Z`,
    facets: ["M 92 154 L 92 306", "M 128 154 L 128 306"],
  },
  flask: {
    top: 154,
    l: 40,
    r: 180,
    d: `M 62 304 C 40 288 36 248 48 212 C 56 184 72 166 96 154
        L 124 154 C 148 166 164 184 172 212 C 184 248 180 288 158 304 Z`,
  },
  teardrop: {
    top: 154,
    l: 50,
    r: 170,
    d: `M 96 154 C 74 172 50 216 50 250 C 50 284 77 306 110 306
        C 143 306 170 284 170 250 C 170 216 146 172 124 154 Z`,
  },
};

const r2 = (n) => Math.round(n * 100) / 100;

/** Knurling / grain / bevels on the actuator. */
function capTexture(cap, top) {
  const x0 = MID - cap.w / 2;
  const out = [];

  if (cap.texture === "knurl") {
    for (let x = x0 + 5; x < x0 + cap.w - 4; x += 4) {
      out.push(
        `<line x1="${x}" y1="${top + 4}" x2="${x}" y2="${top + cap.h - 4}" stroke="rgba(0,0,0,.26)" stroke-width=".9"/>`,
        `<line x1="${x + 1.3}" y1="${top + 4}" x2="${x + 1.3}" y2="${top + cap.h - 4}" stroke="rgba(255,255,255,.2)" stroke-width=".9"/>`,
      );
    }
  } else if (cap.texture === "grain") {
    for (let y = top + 5; y < top + cap.h - 3; y += 5) {
      const wob = (y % 3) - 1;
      out.push(
        `<path d="M ${x0 + 3} ${y} q ${cap.w / 4} ${wob} ${cap.w / 2} 0 q ${cap.w / 4} ${-wob} ${cap.w / 2 - 6} 0"
           fill="none" stroke="rgba(0,0,0,.2)" stroke-width=".9"/>`,
      );
    }
  } else if (cap.texture === "facets") {
    const mid = top + cap.h / 2;
    out.push(
      `<path d="M ${x0} ${mid} L ${MID} ${top + 2} L ${x0 + cap.w} ${mid} Z" fill="rgba(255,255,255,.18)"/>`,
      `<path d="M ${x0} ${mid} L ${MID} ${top + cap.h - 2} L ${x0 + cap.w} ${mid} Z" fill="rgba(0,0,0,.14)"/>`,
    );
  }
  return out.join("");
}

/** Rough advance width of a string, as a multiple of its font size. */
const textWidth = (s, size, factor = 0.5) => s.length * size * factor;

/** Where the label sits on a given silhouette, in SVG user units. */
function labelGeometry(shape) {
  const bodyW = shape.r - shape.l;
  const w = Math.min(86, bodyW - 12);
  return { w, h: w * 0.58, y: Math.max(shape.top + 58, 212) };
}

/**
 * The label is HTML, not SVG.
 *
 * SVG <text> inside a slide that has been transformed keeps a stale raster in
 * Chromium — the plate repaints but the glyphs never do, so the label silently
 * comes up blank on every bottle except the one painted first. HTML text has no
 * such problem, and it gives the label real typographic control. It is sized in
 * percentages of the bottle box, so it tracks the SVG exactly at any scale.
 *
 * @param {import('./index.js').Perfume} perfume
 * @returns {string} HTML markup, to sit alongside the <svg> in .ipx-bottle
 */
export function renderLabel(perfume) {
  const t = perfume.theme;
  const shape = SHAPES[t.shape] || SHAPES.flacon;
  const { w, h, y } = labelGeometry(shape);

  // Narrow bottles get a narrow plate, so the name has to earn its place:
  // drop to the first word rather than let it overrun the label.
  const inner = w - 8;
  let short = perfume.name;
  if (textWidth(short, 7) > inner) short = short.split(" ")[0];

  const markSize = Math.min(11, Math.max(6, h * 0.38));
  const nameSize = Math.min(9, h * 0.32, inner / (short.length * 0.5));
  const sizeSize = Math.min(5.2, Math.max(3.6, h * 0.19));

  // SVG user units -> fractions of the bottle box (viewBox is 220 x 340).
  const em = (units) => `calc(var(--ipx-bottle-h) * ${r2(units / 340)})`;

  return `
    <div class="ipx-label ipx-label-${esc(t.label.style)}" aria-hidden="true" style="
      top:${r2(((y + h / 2) / 340) * 100)}%;
      width:${r2((w / 220) * 100)}%;
      height:${r2((h / 340) * 100)}%;
      --ipx-l-ink:${t.label.ink};
      --ipx-l-plate:${t.label.plate};">
      <span class="ipx-l-mark" style="font-size:${em(markSize)}">IP</span>
      <span class="ipx-l-name" style="font-size:${em(nameSize)}">${esc(short)}</span>
      <span class="ipx-l-rule"></span>
      <span class="ipx-l-size" style="font-size:${em(sizeSize)}">${esc(perfume.size)}</span>
    </div>`;
}

/** The atomiser: neck, knurled collar, stem, actuator and nozzle. */
function atomiser(t, uid, bodyTop, cap, capTop, snoutX, snoutY, nozzleX) {
  return `
  <g class="ipx-atomizer">
    <rect x="95" y="${bodyTop - 26}" width="30" height="30" rx="3" fill="url(#glass-${uid})"
          stroke="rgba(255,255,255,.18)" stroke-width=".9"/>
    <rect x="88" y="110" width="44" height="20" rx="3" fill="url(#collar-${uid})"/>
    <rect x="88" y="110" width="44" height="4" rx="2" fill="rgba(255,255,255,.35)"/>
    ${Array.from(
      { length: 9 },
      (_, i) =>
        `<line x1="${92 + i * 5}" y1="115" x2="${92 + i * 5}" y2="128" stroke="rgba(0,0,0,.2)" stroke-width=".9"/>`,
    ).join("")}

    <g class="ipx-actuator">
      <rect x="103" y="96" width="14" height="18" rx="2" fill="url(#collar-${uid})"/>
      <rect x="${r2(MID - cap.w / 2)}" y="${capTop}" width="${cap.w}" height="${cap.h}"
            rx="${cap.r}" fill="url(#metal-${uid})"/>
      ${capTexture(cap, capTop)}
      <rect x="${r2(MID - cap.w / 2 + 3)}" y="${capTop + 2}" width="${cap.w - 6}" height="3"
            rx="1.5" fill="rgba(255,255,255,.45)"/>

      <g class="ipx-nozzle-side">
        <rect x="${r2(snoutX - 2)}" y="${r2(snoutY)}" width="17" height="11" rx="3" fill="url(#metal-${uid})"/>
        <rect x="${r2(snoutX - 2)}" y="${r2(snoutY)}" width="17" height="3" rx="1.5" fill="rgba(255,255,255,.4)"/>
        <circle cx="${r2(nozzleX - 2)}" cy="${r2(snoutY + 5.5)}" r="2.6" fill="rgba(0,0,0,.62)"/>
        <circle cx="${r2(nozzleX - 2)}" cy="${r2(snoutY + 5.5)}" r="1.2" fill="${t.accentSoft}" opacity=".5"/>
        <circle class="ipx-nozzle-anchor" cx="${r2(nozzleX)}" cy="${r2(snoutY + 5.5)}" r="1" fill="none" opacity="0"/>
      </g>

      <!-- Foreshortened, for when the bottle faces the viewer: pointing at the
           camera, the snout reads as a ring rather than a spout. -->
      <g class="ipx-nozzle-front">
        <ellipse cx="${MID}" cy="${r2(snoutY + 7)}" rx="9" ry="7.5" fill="url(#metal-${uid})"/>
        <ellipse cx="${MID}" cy="${r2(snoutY + 5.4)}" rx="9" ry="3" fill="rgba(255,255,255,.32)"/>
        <circle cx="${MID}" cy="${r2(snoutY + 7)}" r="3.6" fill="rgba(0,0,0,.68)"/>
        <circle cx="${MID}" cy="${r2(snoutY + 7)}" r="1.7" fill="${t.accentSoft}" opacity=".62"/>
        <circle class="ipx-nozzle-anchor" cx="${MID}" cy="${r2(snoutY + 7)}" r="1" fill="none" opacity="0"/>
      </g>
    </g>
  </g>`;
}

/**
 * The attar closure: a finial cap with a glass rod hanging from it.
 *
 * Mukhallats are oils and are never sprayed. The bottle carries a long glass
 * wand fixed to the cap; you draw it out, a bead of oil clings to the tip, and
 * you touch it once to the skin. The whole assembly lifts as one, so it is a
 * single group — and the rod is drawn outside the body clip, since withdrawing
 * it has to carry it up past the neck.
 */
function rodCap(t, uid, bodyTop) {
  // The cap seats on the neck at rest; withdrawing it is what lifts it clear.
  const capH = 46;
  const capTop = bodyTop - 26 - capH + 6;

  return `
  <!-- the neck stays with the bottle; only the closure lifts -->
  <rect x="95" y="${bodyTop - 26}" width="30" height="30" rx="3" fill="url(#glass-${uid})"
        stroke="rgba(255,255,255,.18)" stroke-width=".9"/>

  <g class="ipx-rod-assembly">
    <!-- The rod, hanging into the oil.

         Drawn heavier than a real wand would be. Once it is out of the bottle
         it stands against the background with nothing behind it, and at the
         width glass actually has it read as a bare grey stick with a gold cap
         floating above it. It needs a body, two highlights and a wet tip
         before the eye accepts it as glass. -->
    <g class="ipx-rod">
      <rect x="104.5" y="${capTop + capH - 6}" width="11" height="${r2(ROD_TIP - capTop - capH + 6)}"
            rx="5.5" fill="url(#tube-${uid})" stroke="rgba(255,255,255,.4)" stroke-width=".8"/>
      <!-- the lit edge, and the darker one opposite it -->
      <line x1="107.2" y1="${capTop + capH}" x2="107.2" y2="${ROD_TIP - 8}"
            stroke="rgba(255,255,255,.62)" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="113" y1="${capTop + capH}" x2="113" y2="${ROD_TIP - 8}"
            stroke="rgba(0,0,0,.18)" stroke-width="1.4" stroke-linecap="round"/>
      <!-- the tip, where the oil gathers -->
      <ellipse class="ipx-rod-bead" cx="${MID}" cy="${ROD_TIP}" rx="7" ry="9"
               fill="${t.juice[0]}" opacity=".95"/>
      <ellipse cx="${MID}" cy="${ROD_TIP - 1}" rx="7" ry="9" fill="url(#tube-${uid})" opacity=".55"/>
      <ellipse cx="${r2(MID - 2.4)}" cy="${ROD_TIP - 3}" rx="1.8" ry="2.6"
               fill="rgba(255,255,255,.65)"/>
      <circle class="ipx-nozzle-anchor" cx="${MID}" cy="${ROD_TIP}" r="1" fill="none" opacity="0"/>
    </g>

    <!-- collar and finial cap -->
    <rect x="90" y="${capTop + capH - 8}" width="40" height="12" rx="3" fill="url(#collar-${uid})"/>
    <rect x="90" y="${capTop + capH - 8}" width="40" height="3" rx="1.5" fill="rgba(255,255,255,.34)"/>
    <path d="M 92 ${capTop + capH - 8} L 96 ${capTop + 10} Q ${MID} ${capTop - 2} 124 ${capTop + 10}
             L 128 ${capTop + capH - 8} Z" fill="url(#metal-${uid})"/>
    <path d="M 96 ${capTop + 10} Q ${MID} ${capTop - 2} 124 ${capTop + 10}"
          fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1"/>
    <ellipse cx="${MID}" cy="${capTop + 20}" rx="17" ry="3.4" fill="rgba(0,0,0,.18)"/>
    <circle cx="${MID}" cy="${capTop - 6}" r="7" fill="url(#metal-${uid})"/>
    <circle cx="${r2(MID - 2.2)}" cy="${capTop - 8}" r="2.4" fill="rgba(255,255,255,.5)"/>
  </g>`;
}

/**
 * Render one bottle.
 * @param {import('./index.js').Perfume} perfume
 * @param {string} uid Unique suffix so <defs> ids never collide across bottles.
 * @returns {string} SVG markup
 */
export function renderBottle(perfume, uid) {
  const t = perfume.theme;
  const shape = SHAPES[t.shape] || SHAPES.flacon;
  const bodyTop = shape.top;
  const bodyW = shape.r - shape.l;

  const juiceTop = GROUND - t.fill * (GROUND - bodyTop);

  const cap = t.cap;
  const capTop = 98 - cap.h;
  const snoutY = capTop + cap.h * 0.42;
  const snoutX = MID + cap.w / 2;
  const nozzleX = snoutX + 15;

  // Glasswork, placed from the body extents.
  const hiX = shape.l + bodyW * 0.11;
  const hiW = Math.max(5, bodyW * 0.085);
  const rimX = shape.r - bodyW * 0.12;
  const rimW = Math.max(2.6, bodyW * 0.032);

  const facets = (shape.facets || [])
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1"/>
         <path d="${d}" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="1" transform="translate(1.4,0)"/>`,
    )
    .join("");

  return `
<svg class="ipx-bottle-svg" viewBox="0 0 220 340" role="img"
     aria-label="${esc(perfume.name)} bottle" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="body-${uid}"><path d="${shape.d}"/></clipPath>

    <linearGradient id="juice-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${t.juice[0]}"/>
      <stop offset="52%" stop-color="${t.juice[1]}"/>
      <stop offset="100%" stop-color="${t.juice[2]}"/>
    </linearGradient>

    <linearGradient id="glass-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,.2)"/>
      <stop offset="45%" stop-color="rgba(255,255,255,.04)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,.13)"/>
    </linearGradient>

    <linearGradient id="metal-${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${cap.c3}"/>
      <stop offset="18%" stop-color="${cap.c1}"/>
      <stop offset="46%" stop-color="${cap.c2}"/>
      <stop offset="72%" stop-color="${cap.c1}"/>
      <stop offset="100%" stop-color="${cap.c3}"/>
    </linearGradient>

    <linearGradient id="collar-${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${t.collar.c2}"/>
      <stop offset="24%" stop-color="${t.collar.c1}"/>
      <stop offset="55%" stop-color="${t.collar.c2}"/>
      <stop offset="80%" stop-color="${t.collar.c1}"/>
      <stop offset="100%" stop-color="${t.collar.c2}"/>
    </linearGradient>

    <linearGradient id="tube-${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(255,255,255,.06)"/>
      <stop offset="28%" stop-color="rgba(255,255,255,.34)"/>
      <stop offset="52%" stop-color="rgba(255,255,255,.12)"/>
      <stop offset="78%" stop-color="rgba(255,255,255,.26)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,.05)"/>
    </linearGradient>

    <linearGradient id="foil-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.label.plate}" stop-opacity=".55"/>
      <stop offset="50%" stop-color="${t.label.plate}"/>
      <stop offset="100%" stop-color="${t.label.plate}" stop-opacity=".6"/>
    </linearGradient>

    <radialGradient id="pool-${uid}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity=".5"/>
      <stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/>
    </radialGradient>

    <filter id="soft-${uid}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>

  <!-- One group around the lot. The table's reflection is a <use> of this, so
       the bottle is described once and mirrored rather than rendered twice —
       and the reflection picks up the cap lifting, the liquid sloshing and
       everything else for free. -->
  <g id="bottle-${uid}">

  <!-- pool of light the bottle stands in -->
  <ellipse cx="${MID}" cy="309" rx="${r2(bodyW * 0.78)}" ry="13" fill="url(#pool-${uid})"/>
  <ellipse cx="${MID}" cy="307" rx="${r2(bodyW * 0.42)}" ry="6" fill="rgba(0,0,0,.45)" filter="url(#soft-${uid})"/>

  <!-- ============ closure ============ -->
  ${
    perfume.application === "rod"
      ? rodCap(t, uid, bodyTop)
      : atomiser(t, uid, bodyTop, cap, capTop, snoutX, snoutY, nozzleX)
  }

  <!-- ============ glass body ============ -->
  <path d="${shape.d}" fill="${t.glass}"/>
  <path d="${shape.d}" fill="url(#glass-${uid})"/>

  <g clip-path="url(#body-${uid})">
    <!-- liquid -->
    <!-- The liquid tilts about its own surface as the table turns, so the
         group's origin is the middle of the meniscus and the fill is drawn
         well past the glass on every side: rotated, a body-sized rect would
         swing its corners inside the bottle and leave gaps. It is all clipped
         to the body anyway, so the overspill costs nothing. -->
    <g class="ipx-juice" style="transform-origin:${MID}px ${r2(juiceTop)}px">
      <rect x="-90" y="${r2(juiceTop)}" width="400" height="${r2(420 - juiceTop)}" fill="url(#juice-${uid})"/>
      <!-- Wider than the body so the meniscus still reaches both walls once
           the surface tilts. Clipped, so the excess never shows. -->
      <ellipse cx="${MID}" cy="${r2(juiceTop)}" rx="${r2(bodyW * 0.92)}" ry="5" fill="rgba(255,255,255,.2)"/>
      <ellipse cx="${MID}" cy="${r2(juiceTop + 2)}" rx="${r2(bodyW * 0.92)}" ry="4" fill="rgba(0,0,0,.14)"/>
      <!-- edge shading gives the liquid volume -->
      <rect x="${r2(shape.l - 6)}" y="${r2(juiceTop)}" width="${r2(bodyW * 0.17)}" height="${r2(340 - juiceTop)}" fill="rgba(0,0,0,.2)"/>
      <rect x="${r2(shape.r - bodyW * 0.15)}" y="${r2(juiceTop)}" width="${r2(bodyW * 0.21)}" height="${r2(340 - juiceTop)}" fill="rgba(0,0,0,.18)"/>
      <ellipse cx="${r2(hiX + hiW)}" cy="${r2(juiceTop + 34)}" rx="${r2(hiW * 0.9)}" ry="26" fill="rgba(255,255,255,.1)"/>
    </g>

    <!-- ============ the dip tube (atomisers only) ============ -->
    <g class="ipx-tube" ${perfume.application === "rod" ? 'style="display:none"' : ""}>
      <!-- dry section, above the liquid -->
      <rect x="107.4" y="${r2(bodyTop - 4)}" width="5.2" height="${r2(GROUND - bodyTop)}" rx="2.6"
            fill="url(#tube-${uid})" stroke="rgba(255,255,255,.22)" stroke-width=".5"/>
      <!-- refracted: the liquid magnifies whatever sits behind it -->
      <rect x="105.8" y="${r2(juiceTop)}" width="8.4" height="${r2(GROUND - juiceTop)}" rx="4.2"
            fill="url(#tube-${uid})" opacity=".6"/>
      <rect x="105.8" y="${r2(juiceTop)}" width="8.4" height="${r2(GROUND - juiceTop)}" rx="4.2"
            fill="${t.juice[1]}" opacity=".26"/>
      <!-- the foot draws from just clear of the base -->
      <path d="M 110 ${GROUND - 18} q 0 11 6 14" fill="none" stroke="rgba(255,255,255,.3)"
            stroke-width="4.6" stroke-linecap="round"/>
      <line x1="108.7" y1="${r2(bodyTop)}" x2="108.7" y2="${GROUND - 20}"
            stroke="rgba(255,255,255,.34)" stroke-width=".8"/>
      <!-- liquid climbing the tube when it fires -->
      <rect class="ipx-tube-draw" x="107.4" y="${r2(bodyTop - 4)}" width="5.2"
            height="${r2(juiceTop - bodyTop + 4)}" rx="2.6" fill="${t.juice[0]}" opacity="0"/>
    </g>

    <!-- a couple of bubbles, for life -->
    <circle cx="${r2(hiX + hiW * 2)}" cy="${r2(juiceTop + 22)}" r="2.2" fill="rgba(255,255,255,.28)"/>
    <circle cx="${r2(rimX - 4)}" cy="${r2(juiceTop + 46)}" r="1.5" fill="rgba(255,255,255,.22)"/>
    <circle cx="122" cy="${r2(juiceTop + 14)}" r="1.1" fill="rgba(255,255,255,.26)"/>

    ${facets}

    <!-- specular highlights -->
    <rect x="${r2(hiX)}" y="${r2(bodyTop + 14)}" width="${r2(hiW)}" height="${r2(GROUND - bodyTop - 44)}"
          rx="${r2(hiW / 2)}" fill="rgba(255,255,255,.26)" filter="url(#soft-${uid})"/>
    <rect x="${r2(rimX)}" y="${r2(bodyTop + 26)}" width="${r2(rimW)}" height="${r2(GROUND - bodyTop - 70)}"
          rx="${r2(rimW / 2)}" fill="rgba(255,255,255,.17)" filter="url(#soft-${uid})"/>
    <ellipse cx="${r2(shape.l + bodyW * 0.36)}" cy="${r2(bodyTop + 16)}" rx="${r2(bodyW * 0.2)}" ry="7"
             fill="rgba(255,255,255,.18)" filter="url(#soft-${uid})"/>
  </g>

  <!-- crisp outline last so the glass reads as glass -->
  <path d="${shape.d}" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="1.6"/>
  <path d="${shape.d}" fill="none" stroke="${t.accentSoft}" stroke-width=".6" opacity=".3"/>
  </g>
</svg>`;
}

export default renderBottle;
