# Kanoo Performance Studio — Management Demo

An interactive management/sales demo for Kanoo Performance, presented by WebiQQ. Linked from the
main site's nav as **Management Demo**. This is a frontend prototype with realistic seeded data
persisted to `localStorage` — there is no backend, and it does not represent a real production or
security posture.

## Run locally

```
cd management-demo
npm install
npm run dev      # dev server
npm run build    # production build -> dist/ (committed, so the linked demo works from the static site with no build step)
```

## What's inside

- **Command Centre** — featured vehicle, live operational stats, all 4 workshop bays, activity feed.
- **Performance Studio** — configure a Porsche 911 Turbo S, Nissan GT-R R35, or McLaren 720S across
  Stock/Stage 1/2/3 packages, with a live power/torque chart, itemized hardware, optional add-ons,
  and a quote → approve → convert-to-job flow with a printable quotation.
- **Calibration Lab** — simulated `.bin`/`.hex` file intake, staged verification, launch/burble/limiter
  parameters with Road/Sport/Track presets, and a simulated deployment that updates the linked job.
- **Workshop Operations** — the 4-bay board (Main Dyno, Fabrication, ECU Calibration, Autospa & PPF),
  a job detail panel (checklist, notes, timeline, parts, bay/technician assignment, blockers), and
  invoice generation/issue/payment with a printable invoice.

All monetary values are stored as integer fils (1 BHD = 1000 fils) to avoid floating-point drift.
Data persists in `localStorage` (versioned, with safe fallback to the seed on any corruption); use
the reset icon in the top bar to restore the original seeded state.

## Known limitations

- No backend — everything is client-side and local to the browser.
- Performance figures, pricing, and availability are illustrative demo data, not verified specs or
  confirmed Kanoo Performance stock/partnerships.
- The printable quote/invoice documents use the browser's native print dialog (`window.print()`).
