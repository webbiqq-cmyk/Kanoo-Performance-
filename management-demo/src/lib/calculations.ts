import type {
  Vehicle,
  VehiclePackage,
  PartLine,
  QuoteLineSnapshot,
} from "./types";
import { applyTaxBps, sumFils, type Fils } from "./money";
import { makeId } from "./id";

export interface CurvePoint {
  rpm: number;
  value: number;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
}

/** Torque shape: ramps up, plateaus across the turbo's flat-torque band, tapers toward redline. */
function torqueFraction(
  rpm: number,
  idleRpm: number,
  lowRpm: number,
  highRpm: number,
  redlineRpm: number
): number {
  if (rpm <= lowRpm) return smoothstep(idleRpm, lowRpm, rpm) * 1;
  if (rpm <= highRpm) return 1;
  return 1 - smoothstep(highRpm, redlineRpm, rpm) * 0.32;
}

/** Power shape: rises with rpm and torque, keeps climbing to the power peak near redline. */
function powerFraction(
  rpm: number,
  idleRpm: number,
  peakRpm: number,
  redlineRpm: number
): number {
  if (rpm <= peakRpm) return smoothstep(idleRpm, peakRpm, rpm);
  return 1 - smoothstep(peakRpm, redlineRpm, rpm) * 0.06;
}

const IDLE_RPM = 1200;
const SAMPLES = 13;

export function generatePowerCurve(
  vehicle: Vehicle,
  peakHp: number
): CurvePoint[] {
  const points: CurvePoint[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const rpm = Math.round(
      IDLE_RPM + ((vehicle.redlineRpm - IDLE_RPM) * i) / (SAMPLES - 1)
    );
    const frac = powerFraction(
      rpm,
      IDLE_RPM,
      vehicle.peakPowerRpm,
      vehicle.redlineRpm
    );
    points.push({ rpm, value: Math.round(peakHp * frac) });
  }
  return points;
}

export function generateTorqueCurve(
  vehicle: Vehicle,
  peakNm: number
): CurvePoint[] {
  const points: CurvePoint[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const rpm = Math.round(
      IDLE_RPM + ((vehicle.redlineRpm - IDLE_RPM) * i) / (SAMPLES - 1)
    );
    const frac = torqueFraction(
      rpm,
      IDLE_RPM,
      vehicle.peakTorqueRpmLow,
      vehicle.peakTorqueRpmHigh,
      vehicle.redlineRpm
    );
    points.push({ rpm, value: Math.round(peakNm * frac) });
  }
  return points;
}

export function partLineToSnapshot(
  part: PartLine,
  kind: QuoteLineSnapshot["kind"] = "hardware"
): QuoteLineSnapshot {
  return {
    id: makeId("ln"),
    name: part.name,
    brand: part.brand,
    qty: part.qty,
    unitPriceFils: part.unitPriceFils,
    lineTotalFils: part.qty * part.unitPriceFils,
    kind,
    availability: part.availability,
    required: part.required,
  };
}

export function buildQuoteLines(
  pkg: VehiclePackage,
  optionalParts: PartLine[]
): QuoteLineSnapshot[] {
  const lines: QuoteLineSnapshot[] = pkg.hardware.map((p) =>
    partLineToSnapshot(p, "hardware")
  );
  if (pkg.laborFils > 0) {
    lines.push({
      id: makeId("ln"),
      name: `Installation labor (${pkg.installHours}h)`,
      qty: 1,
      unitPriceFils: pkg.laborFils,
      lineTotalFils: pkg.laborFils,
      kind: "labor",
    });
  }
  for (const p of optionalParts) {
    lines.push(partLineToSnapshot(p, "optional"));
  }
  return lines;
}

export function computeTotals(lines: QuoteLineSnapshot[], taxBps: number) {
  const subtotalFils: Fils = sumFils(lines.map((l) => l.lineTotalFils));
  const taxFils = applyTaxBps(subtotalFils, taxBps);
  const totalFils = subtotalFils + taxFils;
  return { subtotalFils, taxFils, totalFils };
}

export function powerGain(vehicle: Vehicle, pkg: VehiclePackage) {
  const absoluteHp = pkg.estHp - vehicle.stockHp;
  const percentHp = (absoluteHp / vehicle.stockHp) * 100;
  const absoluteNm = pkg.estTorqueNm - vehicle.stockTorqueNm;
  const percentNm = (absoluteNm / vehicle.stockTorqueNm) * 100;
  const accelDelta = vehicle.stock0to100 - pkg.est0to100;
  return { absoluteHp, percentHp, absoluteNm, percentNm, accelDelta };
}
