import { makeId, makeRef } from "./id";
import { bhdToFils } from "./money";
import { buildQuoteLines, computeTotals } from "./calculations";
import type {
  AppState,
  Vehicle,
  VehiclePackage,
  PartLine,
  Customer,
  Quote,
  Job,
  Bay,
  Technician,
  Invoice,
  ActivityEvent,
  ChecklistItem,
} from "./types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();

function part(
  name: string,
  brand: string | undefined,
  qty: number,
  priceBHD: number,
  availability: PartLine["availability"],
  required: boolean,
  perfEffectHp?: number
): PartLine {
  return {
    id: makeId("part"),
    name,
    brand,
    qty,
    unitPriceFils: bhdToFils(priceBHD),
    availability,
    required,
    perfEffectHp,
  };
}

// ---------------------------------------------------------------- vehicles
export const VEHICLES: Vehicle[] = [
  {
    id: "veh_911ts",
    make: "Porsche",
    model: "911 Turbo S (992)",
    year: 2023,
    tagline: "All-wheel-drive twin-turbo flagship",
    engine: "3.7L twin-turbo flat-6",
    drivetrain: "All-wheel drive",
    transmission: "8-speed PDK",
    stockHp: 640,
    stockTorqueNm: 800,
    stock0to100: 2.7,
    redlineRpm: 7200,
    peakPowerRpm: 6750,
    peakTorqueRpmLow: 2500,
    peakTorqueRpmHigh: 4000,
    silhouette: "coupe-awd",
    accent: "#F04438",
  },
  {
    id: "veh_gtr",
    make: "Nissan",
    model: "GT-R R35 (T-spec)",
    year: 2023,
    tagline: "All-wheel-drive twin-turbo icon",
    engine: "3.8L twin-turbo V6",
    drivetrain: "All-wheel drive",
    transmission: "6-speed dual-clutch",
    stockHp: 570,
    stockTorqueNm: 637,
    stock0to100: 2.9,
    redlineRpm: 7100,
    peakPowerRpm: 6800,
    peakTorqueRpmLow: 3300,
    peakTorqueRpmHigh: 5800,
    silhouette: "coupe-rwd",
    accent: "#38D9F5",
  },
  {
    id: "veh_720s",
    make: "McLaren",
    model: "720S",
    year: 2022,
    tagline: "Rear-wheel-drive twin-turbo supercar",
    engine: "4.0L twin-turbo V8",
    drivetrain: "Rear-wheel drive",
    transmission: "7-speed dual-clutch",
    stockHp: 710,
    stockTorqueNm: 770,
    stock0to100: 2.9,
    redlineRpm: 8200,
    peakPowerRpm: 7250,
    peakTorqueRpmLow: 5500,
    peakTorqueRpmHigh: 6700,
    silhouette: "supercar-mid",
    accent: "#FF6A35",
  },
];

// ---------------------------------------------------------------- packages
function buildPackages(vehicleId: string, v: {
  stage1Hp: number; stage1Nm: number; stage1Accel: number; stage1LaborBHD: number; stage1Hw: PartLine[];
  stage2Hp: number; stage2Nm: number; stage2Accel: number; stage2LaborBHD: number; stage2Hw: PartLine[];
  stage3Hp: number; stage3Nm: number; stage3Accel: number; stage3LaborBHD: number; stage3Hw: PartLine[];
}, vehicle: Vehicle): VehiclePackage[] {
  return [
    {
      id: `${vehicleId}_stock`,
      vehicleId,
      tier: "stock",
      name: "Stock Reference",
      description: "Factory configuration — no modifications. Baseline for comparison.",
      estHp: vehicle.stockHp,
      estTorqueNm: vehicle.stockTorqueNm,
      est0to100: vehicle.stock0to100,
      installHours: 0,
      hardware: [],
      laborFils: 0,
    },
    {
      id: `${vehicleId}_stage1`,
      vehicleId,
      tier: "stage1",
      name: "Stage 1 — ECU Calibration",
      description:
        "Bench and stage-1 flash recalibration of the factory ECU for cleaner boost delivery, sharper throttle response and a safe, reversible power gain.",
      estHp: v.stage1Hp,
      estTorqueNm: v.stage1Nm,
      est0to100: v.stage1Accel,
      installHours: 3,
      hardware: v.stage1Hw,
      laborFils: bhdToFils(v.stage1LaborBHD),
    },
    {
      id: `${vehicleId}_stage2`,
      vehicleId,
      tier: "stage2",
      name: "Stage 2 — Calibration + Supporting Hardware",
      description:
        "Stage 1 calibration plus supporting intake, intercooling and exhaust hardware to unlock and sustain a higher boost target reliably.",
      estHp: v.stage2Hp,
      estTorqueNm: v.stage2Nm,
      est0to100: v.stage2Accel,
      installHours: 9,
      hardware: v.stage2Hw,
      laborFils: bhdToFils(v.stage2LaborBHD),
    },
    {
      id: `${vehicleId}_stage3`,
      vehicleId,
      tier: "stage3",
      name: "Stage 3 — Bespoke High-Output Build",
      description:
        "Vehicle-specific turbo upgrade with supporting fuel system and standalone engine management for track-level output. Bench-flowed and mapped in-house.",
      estHp: v.stage3Hp,
      estTorqueNm: v.stage3Nm,
      est0to100: v.stage3Accel,
      installHours: 40,
      hardware: v.stage3Hw,
      laborFils: bhdToFils(v.stage3LaborBHD),
      fitmentNote: "Vehicle-specific turbo upgrade — fitment confirmation required.",
    },
  ];
}

const porsche = VEHICLES[0];
const gtr = VEHICLES[1];
const mclaren = VEHICLES[2];

export const PACKAGES: VehiclePackage[] = [
  ...buildPackages(porsche.id, {
    stage1Hp: 720, stage1Nm: 880, stage1Accel: 2.5, stage1LaborBHD: 220,
    stage1Hw: [part("M1 Piggyback Calibration Interface", "MoTeC", 1, 165, "in-stock", true)],
    stage2Hp: 820, stage2Nm: 960, stage2Accel: 2.35, stage2LaborBHD: 640,
    stage2Hw: [
      part("Carbon Race Intake System", "BMC", 1, 220, "in-stock", true),
      part("Evolution Titanium Downpipe Set", "Akrapovič", 1, 1450, "on-order", true),
      part("Front-Mount Intercooler Upgrade", undefined, 1, 380, "in-stock", true),
      part("M1 Piggyback Calibration Interface", "MoTeC", 1, 165, "in-stock", true),
    ],
    stage3Hp: 950, stage3Nm: 1080, stage3Accel: 2.15, stage3LaborBHD: 2600,
    stage3Hw: [
      part("G-Series Turbo Upgrade Kit — 911 Turbo S (992)", "Garrett", 1, 4200, "fitment-required", true),
      part("Fuel System Upgrade (Pumps + Injectors)", undefined, 1, 1350, "on-order", true),
      part("M1 Standalone Engine Management", "MoTeC", 1, 2100, "in-stock", true),
      part("Evolution Titanium Exhaust System", "Akrapovič", 1, 1650, "on-order", true),
    ],
  }, porsche),
  ...buildPackages(gtr.id, {
    stage1Hp: 650, stage1Nm: 700, stage1Accel: 2.6, stage1LaborBHD: 200,
    stage1Hw: [part("M1 Piggyback Calibration Interface", "MoTeC", 1, 150, "in-stock", true)],
    stage2Hp: 750, stage2Nm: 780, stage2Accel: 2.4, stage2LaborBHD: 560,
    stage2Hw: [
      part("Twin-Cone Induction Kit", "BMC", 1, 195, "in-stock", true),
      part("Evolution Titanium Cat-Back Exhaust", "Akrapovič", 1, 1250, "on-order", true),
      part("Front-Mount Intercooler Upgrade", undefined, 1, 360, "in-stock", true),
      part("M1 Piggyback Calibration Interface", "MoTeC", 1, 150, "in-stock", true),
    ],
    stage3Hp: 1000, stage3Nm: 1150, stage3Accel: 2.05, stage3LaborBHD: 2800,
    stage3Hw: [
      part("G-Series Turbo Upgrade Kit — GT-R R35", "Garrett", 1, 4600, "fitment-required", true),
      part("Fuel System Upgrade (Pumps + Injectors)", undefined, 1, 1400, "on-order", true),
      part("M1 Standalone Engine Management", "MoTeC", 1, 2100, "in-stock", true),
      part("Evolution Titanium Exhaust System", "Akrapovič", 1, 1550, "on-order", true),
    ],
  }, gtr),
  ...buildPackages(mclaren.id, {
    stage1Hp: 780, stage1Nm: 840, stage1Accel: 2.6, stage1LaborBHD: 230,
    stage1Hw: [part("M1 Piggyback Calibration Interface", "MoTeC", 1, 175, "in-stock", true)],
    stage2Hp: 850, stage2Nm: 900, stage2Accel: 2.4, stage2LaborBHD: 700,
    stage2Hw: [
      part("Carbon Race Intake System", "BMC", 1, 240, "in-stock", true),
      part("Evolution Titanium Exhaust", "Akrapovič", 1, 1550, "on-order", true),
      part("Charge-Air Cooler Upgrade (Pair)", undefined, 1, 520, "in-stock", true),
      part("M1 Piggyback Calibration Interface", "MoTeC", 1, 175, "in-stock", true),
    ],
    stage3Hp: 1010, stage3Nm: 1020, stage3Accel: 2.2, stage3LaborBHD: 2950,
    stage3Hw: [
      part("G-Series Turbo Upgrade Kit — 720S", "Garrett", 1, 4800, "fitment-required", true),
      part("Fuel System Upgrade (Pumps + Injectors)", undefined, 1, 1400, "on-order", true),
      part("M1 Standalone Engine Management", "MoTeC", 1, 2150, "in-stock", true),
      part("Evolution Titanium Exhaust System", "Akrapovič", 1, 1700, "on-order", true),
    ],
  }, mclaren),
];

// ------------------------------------------------------ optional add-ons
export const OPTIONAL_CATALOG: Record<string, PartLine[]> = Object.fromEntries(
  VEHICLES.map((v) => [
    v.id,
    [
      part("Ceramic Coating (5-year)", undefined, 1, 320, "in-stock", false),
      part("Full-Body Paint Protection Film", "LLumar", 1, 1450, "on-order", false),
      part("Carbon Fibre Front Splitter", undefined, 1, 680, "in-stock", false),
      part(
        "Secondary Catalytic Delete (Track Use Only)",
        undefined,
        1,
        420,
        "on-order",
        false,
        15
      ),
    ],
  ])
);

function findPkg(vehicleId: string, tier: VehiclePackage["tier"]): VehiclePackage {
  const p = PACKAGES.find((p) => p.vehicleId === vehicleId && p.tier === tier);
  if (!p) throw new Error(`missing package ${vehicleId}/${tier}`);
  return p;
}

// ---------------------------------------------------------------- people
export const CUSTOMERS: Customer[] = [
  { id: "cus_1", name: "Khalid Mattar", phone: "+973 3600 1122", email: "khalid.mattar@example.com" },
  { id: "cus_2", name: "Sara Al-Dossari", phone: "+973 3600 3344", email: "sara.aldossari@example.com" },
  { id: "cus_3", name: "James Whitfield", phone: "+973 3600 5566", email: "james.whitfield@example.com" },
  { id: "cus_4", name: "Layla Haidari", phone: "+973 3600 7788", email: "layla.haidari@example.com" },
  { id: "cus_5", name: "Faisal Noor", phone: "+973 3600 9900", email: "faisal.noor@example.com" },
  { id: "cus_6", name: "Ahmed Bucheeri", phone: "+973 3601 1212", email: "ahmed.bucheeri@example.com" },
  { id: "cus_7", name: "Noora Al-Sayed", phone: "+973 3601 3434", email: "noora.alsayed@example.com" },
];

export const TECHNICIANS: Technician[] = [
  { id: "tech_1", name: "Yusuf Al-Ansari", role: "Dyno & Calibration Lead" },
  { id: "tech_2", name: "Marcus Silva", role: "Fabrication Specialist" },
  { id: "tech_3", name: "Ahmed Rashid", role: "Detailing & PPF Technician" },
  { id: "tech_4", name: "Omar Khalfan", role: "Calibration Engineer" },
];

const TAX_BPS = 1000; // 10% demo VAT assumption

function checklistFor(tier: string): ChecklistItem[] {
  const base = [
    { id: makeId("chk"), label: "Pre-inspection & baseline dyno pull", done: false },
    { id: makeId("chk"), label: "Parts received & verified", done: false },
    { id: makeId("chk"), label: "Installation complete", done: false },
    { id: makeId("chk"), label: "Calibration deployed", done: false },
    { id: makeId("chk"), label: "Verification dyno pull", done: false },
    { id: makeId("chk"), label: "Road test", done: false },
    { id: makeId("chk"), label: "Final quality check", done: false },
  ];
  if (tier === "stock") {
    return [
      { id: makeId("chk"), label: "Vehicle intake & wash", done: false },
      { id: makeId("chk"), label: "Paint correction", done: false },
      { id: makeId("chk"), label: "PPF / ceramic application", done: false },
      { id: makeId("chk"), label: "Curing", done: false },
      { id: makeId("chk"), label: "Final inspection", done: false },
    ];
  }
  return base;
}

function markDone(items: ChecklistItem[], count: number): ChecklistItem[] {
  return items.map((it, i) => (i < count ? { ...it, done: true } : it));
}

// ------------------------------------------------------------- quotes
function makeQuote(
  ref: string,
  customerId: string,
  vehicleId: string,
  tier: VehiclePackage["tier"],
  status: Quote["status"],
  createdAt: number,
  optionalPartIds: string[] = []
): Quote {
  const pkg = findPkg(vehicleId, tier);
  const optionals = (OPTIONAL_CATALOG[vehicleId] ?? []).filter((p) => optionalPartIds.includes(p.id));
  const lines = buildQuoteLines(pkg, optionals);
  const { subtotalFils, taxFils, totalFils } = computeTotals(lines, TAX_BPS);
  return {
    id: makeId("quote"),
    ref,
    customerId,
    vehicleId,
    packageId: pkg.id,
    optionalPartIds,
    lines,
    subtotalFils,
    taxBps: TAX_BPS,
    taxFils,
    totalFils,
    notes: "",
    status,
    createdAt,
    approvedAt: status !== "draft" ? createdAt + 2 * HOUR : undefined,
  };
}

const q1 = makeQuote("QT-0001", "cus_1", porsche.id, "stage2", "converted", now - 3 * DAY);
const q2 = makeQuote("QT-0002", "cus_2", gtr.id, "stage1", "converted", now - 2 * DAY);
const q3 = makeQuote("QT-0003", "cus_3", mclaren.id, "stage3", "converted", now - 5 * DAY);
const ppfPart = OPTIONAL_CATALOG[porsche.id][1]; // Full-Body PPF
const q4 = makeQuote("QT-0004", "cus_4", porsche.id, "stock", "converted", now - 1 * DAY, [ppfPart.id]);
const q5 = makeQuote("QT-0005", "cus_5", porsche.id, "stage1", "draft", now - 6 * HOUR);
const q6 = makeQuote("QT-0006", "cus_6", mclaren.id, "stage2", "draft", now - 3 * HOUR);
const q7 = makeQuote("QT-0007", "cus_7", gtr.id, "stage1", "converted", now - 9 * DAY);

// --------------------------------------------------------------- jobs
function makeJob(
  ref: string,
  quote: Quote,
  status: Job["status"],
  createdAt: number,
  doneCount: number,
  blockedReason: string | null = null
): Job {
  const pkg = PACKAGES.find((p) => p.id === quote.packageId)!;
  const checklist = markDone(checklistFor(pkg.tier), doneCount);
  return {
    id: makeId("job"),
    ref,
    quoteId: quote.id,
    customerId: quote.customerId,
    vehicleId: quote.vehicleId,
    packageId: quote.packageId,
    priceSnapshot: {
      lines: quote.lines,
      subtotalFils: quote.subtotalFils,
      taxBps: quote.taxBps,
      taxFils: quote.taxFils,
      totalFils: quote.totalFils,
    },
    bayId: null,
    status,
    blockedReason,
    checklist,
    notes: [],
    statusTimeline: [{ status: "queued", at: createdAt }, { status, at: createdAt + HOUR }],
    createdAt,
  };
}

const jobA = makeJob("JOB-0001", q1, "in_progress", now - 3 * DAY, 3);
const jobB = makeJob("JOB-0002", q2, "in_progress", now - 2 * DAY, 4);
const jobC = makeJob("JOB-0003", q3, "in_progress", now - 5 * DAY, 1, "Awaiting Garrett turbo upgrade kit — ETA 3 days");
const jobD = makeJob("JOB-0004", q4, "in_progress", now - 1 * DAY, 2);
const jobE = makeJob("JOB-0005", q7, "completed", now - 9 * DAY, 7);
jobE.statusTimeline = [
  { status: "queued", at: now - 9 * DAY },
  { status: "in_progress", at: now - 8.5 * DAY },
  { status: "quality_check", at: now - 8 * DAY },
  { status: "ready", at: now - 7.8 * DAY },
  { status: "completed", at: now - 7.5 * DAY },
];

q1.convertedJobId = jobA.id;
q2.convertedJobId = jobB.id;
q3.convertedJobId = jobC.id;
q4.convertedJobId = jobD.id;
q7.convertedJobId = jobE.id;

// --------------------------------------------------------------- bays
export const BAYS: Bay[] = [
  {
    id: "bay_1",
    number: 1,
    name: "Main Dyno",
    kind: "dyno",
    purpose: "Wide-band dyno pulls & load testing",
    jobId: jobA.id,
    technicianId: "tech_1",
    statusLabel: "Live dyno pull",
    enteredStageAt: now - 35 * 60 * 1000,
  },
  {
    id: "bay_2",
    number: 2,
    name: "Fabrication",
    kind: "fabrication",
    purpose: "Custom fabrication & turbo installs",
    jobId: jobC.id,
    technicianId: "tech_2",
    statusLabel: "Awaiting parts",
    enteredStageAt: now - 2 * DAY,
    blockedReason: "Awaiting Garrett turbo upgrade kit — ETA 3 days",
  },
  {
    id: "bay_3",
    number: 3,
    name: "ECU Calibration",
    kind: "calibration",
    purpose: "Standalone & piggyback ECU calibration",
    jobId: jobB.id,
    technicianId: "tech_4",
    statusLabel: "Calibration complete",
    enteredStageAt: now - 50 * 60 * 1000,
  },
  {
    id: "bay_4",
    number: 4,
    name: "Autospa & PPF",
    kind: "detailing",
    purpose: "Paint protection film, ceramic coating & detailing",
    jobId: jobD.id,
    technicianId: "tech_3",
    statusLabel: "Curing",
    enteredStageAt: now - 70 * 60 * 1000,
    estimatedReadyAt: now + 5 * HOUR,
  },
];

jobA.bayId = "bay_1";
jobB.bayId = "bay_3";
jobC.bayId = "bay_2";
jobD.bayId = "bay_4";

// ----------------------------------------------------------- invoices
function makeInvoice(ref: string, job: Job, paidFraction: number, createdAt: number): Invoice {
  const paidFils = Math.round(job.priceSnapshot.totalFils * paidFraction);
  const payments =
    paidFils > 0
      ? [
          {
            id: makeId("pay"),
            invoiceId: "",
            amountFils: paidFils,
            method: "bank_transfer" as const,
            at: createdAt + HOUR,
          },
        ]
      : [];
  const invId = makeId("inv");
  payments.forEach((p) => (p.invoiceId = invId));
  return {
    id: invId,
    ref,
    jobId: job.id,
    customerId: job.customerId,
    vehicleId: job.vehicleId,
    lines: job.priceSnapshot.lines,
    subtotalFils: job.priceSnapshot.subtotalFils,
    taxBps: job.priceSnapshot.taxBps,
    taxFils: job.priceSnapshot.taxFils,
    totalFils: job.priceSnapshot.totalFils,
    paidFils,
    status: paidFils >= job.priceSnapshot.totalFils ? "paid" : paidFils > 0 ? "partially_paid" : "issued",
    createdAt,
    issuedAt: createdAt,
    payments,
  };
}

const inv1 = makeInvoice("INV-0001", jobE, 0.6, now - 7 * DAY);
jobE.invoiceId = inv1.id;

export const INVOICES: Invoice[] = [inv1];

// ----------------------------------------------------------- activity
function activityEvent(
  type: ActivityEvent["type"],
  message: string,
  at: number,
  read: boolean,
  refType: ActivityEvent["refType"],
  refId: string
): ActivityEvent {
  return { id: makeId("act"), type, message, at, read, refType, refId };
}

export const ACTIVITY: ActivityEvent[] = [
  activityEvent("quote_created", `${q6.ref} created for ${CUSTOMERS.find((c) => c.id === "cus_6")!.name} — McLaren 720S Stage 2`, now - 3 * HOUR, true, "quote", q6.id),
  activityEvent("quote_created", `${q5.ref} created for ${CUSTOMERS.find((c) => c.id === "cus_5")!.name} — Porsche 911 Turbo S Stage 1`, now - 6 * HOUR, true, "quote", q5.id),
  activityEvent("bay_status_changed", "Bay 04 — Autospa & PPF entered curing stage", now - 70 * 60 * 1000, true, "bay", "bay_4"),
  activityEvent("calibration_deployed", `Calibration deployed for ${jobB.ref} — Nissan GT-R R35`, now - 50 * 60 * 1000, false, "job", jobB.id),
  activityEvent("parts_received", "Front-mount intercooler received for JOB-0001 — Porsche 911 Turbo S", now - 40 * 60 * 1000, false, "job", jobA.id),
  activityEvent("vehicle_assigned", "Porsche 911 Turbo S assigned to Bay 01 — Main Dyno", now - 35 * 60 * 1000, false, "bay", "bay_1"),
  activityEvent("invoice_issued", `${inv1.ref} issued for ${CUSTOMERS.find((c) => c.id === "cus_7")!.name} — BHD ${(inv1.totalFils / 1000).toFixed(3)}`, now - 7 * DAY, true, "invoice", inv1.id),
  activityEvent("payment_recorded", `Partial payment recorded on ${inv1.ref}`, now - 7 * DAY + HOUR, true, "invoice", inv1.id),
].sort((a, b) => b.at - a.at);

// -------------------------------------------------------------- state
export function buildInitialState(): AppState {
  return {
    version: 1,
    vehicles: VEHICLES,
    packages: PACKAGES,
    customers: CUSTOMERS,
    quotes: [q1, q2, q3, q4, q5, q6, q7],
    jobs: [jobA, jobB, jobC, jobD, jobE],
    bays: BAYS,
    technicians: TECHNICIANS,
    calibrationSessions: [],
    invoices: INVOICES,
    activity: ACTIVITY,
    seq: { quote: 8, job: 6, invoice: 2 },
  };
}

export const TAX_BPS_DEFAULT = TAX_BPS;
export { makeRef };
