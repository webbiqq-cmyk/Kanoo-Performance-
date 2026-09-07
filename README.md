# Kanoo Performance — Concept Demo Site

An unofficial concept/demo website for **Kanoo Performance** (Tubli, Manama, Bahrain) — the
Kingdom's largest supercar customization, tuning and restoration facility. Built from publicly
available info: their [Instagram](https://www.instagram.com/kanooperformance/), Google Business
listing, the Garrett Advancing Motion partnership announcement, and facility photos.

**This is not the official Kanoo Performance website.** No affiliation is claimed — it's a pitch
demo of what a full marketing site + build configurator could look like for the brand.

## Design system — "Concrete & Signal"

Drawn from the real KP facility rather than the generic aftermarket-tuner look:

- **Palette** — off-white workshop wall, warm-grey porcelain floor, ceiling black, with the KP
  **signal red** used once per view (never as fill blocks).
- **Type** — `Saira` (wide technical display, echoes the KP wordmark) + `Inter` for body.
- **Motif** — the angular white LED light-line from the workshop ceiling, used as hero accent,
  hover sweeps and section cuts. The `«KP` chevron before every eyebrow.
- **Layout** — photography-forward, generous negative space, alternating dark cinematic bands and
  bright editorial bands. Cars are the only colour.

## Pages

- **`index.html`** — top bar, sticky nav, cinematic hero, partner marquee, statement + spec list,
  6-tile capabilities grid, 4-panel facility gallery, filterable "Selected Work" grid, configurator
  teaser, 4-step process, CTA band, contact (form → WhatsApp prefill), footer.
- **`configurator.html`** — "Configure your build": BMW M4 Competition / Mercedes-Benz S-Class /
  Mercedes-AMG G63, spec kit, aero, exhaust, ECU tune, suspension, brakes, wheels, tires,
  paint/wrap, PPF, tint, interior — live inline-SVG preview, running HUD (est. HP / ride Δ / wheel
  size / est. cost) and a build sheet. Submitting opens WhatsApp (`wa.me/97317780555`) with the
  full spec pre-filled; "Copy Build Summary" copies it to the clipboard. No data is stored or sent.

## Structure

```
index.html            Home
configurator.html     Build configurator + inquiry
css/style.css         Design system + both pages
js/main.js            Nav, reveal-on-scroll, count-up, work filter, contact→WhatsApp
js/configurator.js    Configurator state, pricing, SVG rendering, WhatsApp/summary
assets/               Photography drop-in — see assets/README.md
```

## Photography

Every image slot renders a CSS placeholder "plate" tagged with the filename it expects. Drop real
hi-res KP photos into `assets/` and wire them in per `assets/README.md` — the layout is unchanged.
Progressive enhancement: `.reveal` elements are visible by default and only animate when JS loads
(`html.js` gate + 4s safety net); `prefers-reduced-motion` is respected.

## Running locally

No build step — static HTML/CSS/JS.

```
python3 -m http.server 8000
# open http://localhost:8000/index.html
```
