import type { Fils } from "./money";

export type Silhouette = "coupe-awd" | "coupe-rwd" | "supercar-mid";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  tagline: string;
  engine: string;
  drivetrain: string;
  transmission: string;
  stockHp: number;
  stockTorqueNm: number;
  stock0to100: number; // seconds
  redlineRpm: number;
  peakPowerRpm: number;
  peakTorqueRpmLow: number;
  peakTorqueRpmHigh: number;
  silhouette: Silhouette;
  accent: string; // hex used for chart/card accents per vehicle
}

export type PackageTier = "stock" | "stage1" | "stage2" | "stage3";
export type Availability = "in-stock" | "on-order" | "fitment-required";

export interface PartLine {
  id: string;
  name: string;
  brand?: string;
  qty: number;
  unitPriceFils: Fils;
  availability: Availability;
  required: boolean;
  /** Only set on the rare optional item whose data explicitly defines a performance effect. */
  perfEffectHp?: number;
}

export interface VehiclePackage {
  id: string;
  vehicleId: string;
  tier: PackageTier;
  name: string;
  description: string;
  estHp: number;
  estTorqueNm: number;
  est0to100: number;
  installHours: number;
  hardware: PartLine[];
  laborFils: number;
  fitmentNote?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface QuoteLineSnapshot {
  id: string;
  name: string;
  brand?: string;
  qty: number;
  unitPriceFils: Fils;
  lineTotalFils: Fils;
  kind: "hardware" | "labor" | "optional";
  availability?: Availability;
  required?: boolean;
}

export type QuoteStatus = "draft" | "approved" | "converted";

export interface Quote {
  id: string;
  ref: string;
  customerId: string;
  vehicleId: string;
  packageId: string;
  optionalPartIds: string[];
  lines: QuoteLineSnapshot[];
  subtotalFils: Fils;
  taxBps: number;
  taxFils: Fils;
  totalFils: Fils;
  notes: string;
  status: QuoteStatus;
  createdAt: number;
  approvedAt?: number;
  convertedJobId?: string;
}

export type JobStatus =
  | "queued"
  | "in_progress"
  | "quality_check"
  | "ready"
  | "completed";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface JobNote {
  id: string;
  text: string;
  at: number;
  author: string;
}

export interface StatusEvent {
  status: JobStatus;
  at: number;
}

export interface Job {
  id: string;
  ref: string;
  quoteId: string;
  customerId: string;
  vehicleId: string;
  packageId: string;
  priceSnapshot: {
    lines: QuoteLineSnapshot[];
    subtotalFils: Fils;
    taxBps: number;
    taxFils: Fils;
    totalFils: Fils;
  };
  bayId: string | null;
  status: JobStatus;
  blockedReason: string | null;
  checklist: ChecklistItem[];
  notes: JobNote[];
  statusTimeline: StatusEvent[];
  createdAt: number;
  calibrationSessionId?: string;
  invoiceId?: string;
}

export type BayKind = "dyno" | "fabrication" | "calibration" | "detailing";

export interface Bay {
  id: string;
  number: number;
  name: string;
  kind: BayKind;
  purpose: string;
  jobId: string | null;
  technicianId: string | null;
  statusLabel: string;
  enteredStageAt: number;
  blockedReason?: string | null;
  estimatedReadyAt?: number | null;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
}

export type CalibrationStatus =
  | "idle"
  | "reading"
  | "integrity_check"
  | "loading_profile"
  | "ready"
  | "deploying"
  | "complete";

export interface CalibrationParams {
  launchRpm: number;
  burble: number; // 0-5
  limiterBypass: boolean;
}

export type CalibrationPreset = "road" | "sport" | "track" | "custom";

export interface CalibrationSession {
  id: string;
  jobId: string;
  fileName: string;
  fileSizeBytes: number;
  status: CalibrationStatus;
  preset: CalibrationPreset;
  params: CalibrationParams;
  createdAt: number;
  deployedAt?: number;
}

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid";

export interface Payment {
  id: string;
  invoiceId: string;
  amountFils: Fils;
  method: "card" | "cash" | "bank_transfer";
  at: number;
}

export interface Invoice {
  id: string;
  ref: string;
  jobId: string;
  customerId: string;
  vehicleId: string;
  lines: QuoteLineSnapshot[];
  subtotalFils: Fils;
  taxBps: number;
  taxFils: Fils;
  totalFils: Fils;
  paidFils: Fils;
  status: InvoiceStatus;
  createdAt: number;
  issuedAt?: number;
  payments: Payment[];
}

export type ActivityType =
  | "quote_created"
  | "quote_approved"
  | "quote_converted"
  | "parts_received"
  | "vehicle_assigned"
  | "bay_status_changed"
  | "calibration_deployed"
  | "job_completed"
  | "invoice_issued"
  | "payment_recorded";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  message: string;
  at: number;
  refType?: "quote" | "job" | "invoice" | "bay";
  refId?: string;
  read: boolean;
}

export interface AppState {
  version: number;
  vehicles: Vehicle[];
  packages: VehiclePackage[];
  customers: Customer[];
  quotes: Quote[];
  jobs: Job[];
  bays: Bay[];
  technicians: Technician[];
  calibrationSessions: CalibrationSession[];
  invoices: Invoice[];
  activity: ActivityEvent[];
  seq: {
    quote: number;
    job: number;
    invoice: number;
  };
}
