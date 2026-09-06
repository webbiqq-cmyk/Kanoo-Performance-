# Kanoo Performance — Concept Demo Site

An unofficial concept/demo website for **Kanoo Performance** (Tubli, Manama, Bahrain) — built from
publicly available info: their [Instagram](https://www.instagram.com/kanooperformance/) profile,
Google Business listing, and photos of real KP-watermarked builds shared during this session.

**This is not the official Kanoo Performance website.** No affiliation is claimed; it's a demo of
what a full marketing site + build configurator could look like for the brand.

## Pages

- **`index.html`** — Home: hero, brand/partner marquee, about, services grid, recent-builds gallery,
  CTA, location & contact, footer.
- **`configurator.html`** — "Build Your Kanoo": pick a **BMW M4 Competition**, **Mercedes-Benz S-Class**,
  or **Mercedes-AMG G63**, spec body kit, aero, exhaust, ECU tune, suspension, brakes, wheels, tires,
  paint/wrap, PPF, tint and interior — with a live SVG preview, running HUD (est. HP / ride height /
  wheel size / est. cost) and a build sheet. Submitting the inquiry form opens WhatsApp
  (`wa.me/97317780555`) with the full spec pre-filled; "Copy Build Summary" copies it to the clipboard.
  No data is stored or sent anywhere by this demo itself.

## Structure

```
index.html            Home page
configurator.html     Build configurator + inquiry form
css/style.css         Shared design system ("Blueprint Garage": carbon black + HUD red/amber)
js/main.js            Nav, scroll-reveal, stat count-up (progressively enhanced — see below)
js/configurator.js     Configurator state, pricing, SVG rendering, WhatsApp/summary generation
```

## Notes on the visuals

Real KP photos were shared in chat during this build, but they exist only as inline chat content —
there was no accessible file on disk to pull them from (checked the session's attachment/upload
paths; none were populated). So instead of broken `<img>` tags, the gallery cards use color-matched
CSS treatments with accurate captions for the specific vehicles shown (Civic Type R line-up in
Service Bay 4, GT3 RS in blue livery, X5 M on the alignment rack, Lexus GX overlander, McLaren Elva
in satin purple, plus the McLaren P1 / 1960 Corvette / Supra-on-dyno / GT3 from an earlier round).
Drop real image files into the repo (e.g. `assets/gallery/`) and wire them into the `.g-card`
elements in `index.html` to upgrade this to real photography — everything else is unaffected.

The car preview in the configurator is custom inline SVG (paint color, kit, wing, wheel style and
ride height all respond live to your selections) rather than photography, so it never depends on
external assets or network access.

## Progressive enhancement

`.reveal` elements fade in on scroll via `IntersectionObserver`, gated behind an `html.js` class set
by an inline script — if JavaScript fails to load for any reason, content stays fully visible by
default rather than stuck at `opacity: 0`. A 4s timeout in `main.js` is a second safety net.

## Running locally

No build step — it's static HTML/CSS/JS.

```
python3 -m http.server 8000
# open http://localhost:8000/index.html
```
