# Photography drop-in

The redesign is photography-forward. Every image slot currently shows a CSS
placeholder "plate" with a small corner tag naming the file it expects. Drop real
hi-res photos in here and wire them in — the layout doesn't change.

## Hero (`index.html`)
Replace:
```html
<div class="hero-plate"></div>
```
with:
```html
<div class="hero-media"><img src="assets/hero-workshop.jpg" alt="The Kanoo Performance workshop floor"></div>
```
Best source: the wide workshop establishing shot (Corvettes on the floor, KP wall
wordmark, angular ceiling light-lines). A short muted looping `<video>` also works.

## The Facility grid (`index.html` → `#facility`)
Four `<figure class="fac …">`. In each, replace the
`<div class="plate …"></div><span class="plate-tag">…</span>` with:
```html
<img src="assets/facility-workshop.jpg" alt="">
```
- `fac--a` → workshop-wide.jpg
- `fac--b` → dyno-cell.jpg (the 718 on the rolling road)
- `fac--c` → showroom.jpg (black SUV, gloss floor, KP wall mark)
- `fac--d` → fab-shop.jpg (exhaust / TIG work)

## Selected Work grid (`index.html` → `#work`)
Six `<a class="build …">`. Replace `<div class="build-plate plate …"></div>` with
`<img src="assets/build-01.jpg" alt="">`. Suggested cars, in order:
1. C7 Corvette widebody + livery
2. GR Yaris (tall) — front 3/4 in a bay
3. 718 Boxster on the dyno
4. Blacked luxury SUV on forged wheels
5. '77 Trans Am (tall)
6. C3 Corvette on the lift

## Configure teaser
`.configure-visual` uses an inline SVG car; leave it, or drop a cinematic build
photo behind it.

## Notes
- Aim for 2000px on the long edge, JPG ~80% quality, sRGB.
- Keep the grey/black/white tone — let the cars be the only colour.
- Instagram screenshots have play buttons and carousel arrows baked in; crop those
  out or export originals from KP before use.
