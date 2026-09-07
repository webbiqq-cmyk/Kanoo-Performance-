# Assets

## Photography (in use)

Wired into `index.html` now, cropped/compressed from KP source shots:

| file | shown as | source car |
|---|---|---|
| `hero-workshop.jpg` | hero backdrop (darkened) | wide workshop, 3 Corvettes + C3 on lift |
| `facility-workshop.jpg` | Facility → The Workshop | 992 GT3 RS, KP wall mark |
| `facility-showroom.jpg` | Facility → The Gallery (portrait) | blue AMG G63, white gloss floor |
| `facility-mclaren.jpg` | Facility → The McLaren Bay | Pagani Huayra + McLarens |
| `facility-fab.jpg` | Facility → The Fab Shop | 997 GTS + titanium exhaust laid out |
| `build-01.jpg` | Work 01 | McLaren P1, Volcano Orange |
| `build-02.jpg` | Work 02 (portrait) | Pagani Zonda, exposed carbon |
| `build-03.jpg` | Work 03 | 997 GTS exhaust build |
| `build-04.jpg` | Work 04 | McLaren Elva, satin purple |
| `build-05.jpg` | Work 05 (portrait) | '77 Trans Am |
| `build-06.jpg` | Work 06 | satin-grey 996 on a lift |

These are ~1200–1800px, compressed from screenshots. **Replace with full-res
originals from KP** when available — keep the same filenames and the site picks
them up. Ideal: 2400px long edge, sRGB, q80 JPG. Portrait slots (`facility-showroom`,
`build-02`, `build-05`) need portrait-orientation source.

### Still needed
- ~~KP logo~~ — added (`logo-white.png` / `logo-dark.png`, from a supplied lockup). A vector (SVG) version would sharpen it further.
  header/footer currently draw a stand-in chevron.
- Optional: partner logos (Garrett, Hunter, McLaren, ARB, IPD, Xtreme, LLumar) for
  the marquee, currently set as text.

## 3D car model  →  `assets/supercar.glb`
Hero right column runs `<model-viewer>`. Drag to orbit, turns on scroll, idle spin.

**Currently shipped:** a detailed Lamborghini Aventador, optimised to ~1.5 MB
(Draco geometry + WebP textures via `npx @gltf-transform/cli optimize`). Stand-in —
**replace with a KP-owned / licensed model before production**, ideally a car KP
actually builds. Run the same optimise step on the replacement to keep it light.
Drop the new file in as `assets/supercar.glb`; add `poster="assets/supercar-poster.webp"`
to the tag for a crisp first paint, and a `.usdz` twin for iOS "view in your space".
