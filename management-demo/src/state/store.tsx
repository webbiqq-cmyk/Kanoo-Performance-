import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  AppState,
  Bay,
  CalibrationParams,
  CalibrationPreset,
  CalibrationStatus,
  Customer,
  Invoice,
  Job,
  JobStatus,
  Payment,
  Quote,
} from "../lib/types";
import { loadState, saveState, resetState } from "../lib/storage";
import { buildQuoteLines, computeTotals } from "../lib/calculations";
import { OPTIONAL_CATALOG, PACKAGES, TAX_BPS_DEFAULT } from "../lib/seed";
import { makeId, makeRef } from "../lib/id";

const JOB_ORDER: JobStatus[] = [
  "queued",
  "in_progress",
  "quality_check",
  "ready",
  "completed",
];

// -------------------------------------------------------------- actions
type Action =
  | { type: "RESET" }
  | {
      type: "SAVE_QUOTE";
      payload: {
        quoteId?: string;
        customer: { name: string; phone: string; email: string };
        vehicleId: string;
        packageId: string;
        optionalPartIds: string[];
        notes: string;
        taxBps: number;
      };
    }
  | { type: "APPROVE_QUOTE"; payload: { quoteId: string } }
  | { type: "CONVERT_QUOTE_TO_JOB"; payload: { quoteId: string } }
  | { type: "ASSIGN_JOB_TO_BAY"; payload: { jobId: string; bayId: string } }
  | { type: "ASSIGN_TECHNICIAN"; payload: { bayId: string; technicianId: string | null } }
  | { type: "UPDATE_JOB_STATUS"; payload: { jobId: string; status: JobStatus } }
  | { type: "SET_BLOCKED"; payload: { jobId: string; reason: string | null } }
  | { type: "TOGGLE_CHECKLIST"; payload: { jobId: string; itemId: string } }
  | { type: "ADD_NOTE"; payload: { jobId: string; text: string } }
  | { type: "RELEASE_BAY"; payload: { bayId: string } }
  | {
      type: "CREATE_CALIBRATION_SESSION";
      payload: { jobId: string; fileName: string; fileSizeBytes: number };
    }
  | { type: "SET_CALIBRATION_STATUS"; payload: { sessionId: string; status: CalibrationStatus } }
  | {
      type: "SET_CALIBRATION_PARAMS";
      payload: { sessionId: string; params: Partial<CalibrationParams>; preset: CalibrationPreset };
    }
  | { type: "APPLY_PRESET"; payload: { sessionId: string; preset: CalibrationPreset; params: CalibrationParams } }
  | { type: "DEPLOY_CALIBRATION_COMPLETE"; payload: { sessionId: string } }
  | { type: "REMOVE_CALIBRATION_SESSION"; payload: { jobId: string } }
  | { type: "GENERATE_INVOICE"; payload: { jobId: string } }
  | { type: "ISSUE_INVOICE"; payload: { invoiceId: string } }
  | {
      type: "RECORD_PAYMENT";
      payload: { invoiceId: string; amountFils: number; method: Payment["method"] };
    }
  | { type: "MARK_ACTIVITY_READ"; payload: { id: string } }
  | { type: "MARK_ALL_ACTIVITY_READ" };

function pushActivity(
  state: AppState,
  type: AppState["activity"][number]["type"],
  message: string,
  refType?: AppState["activity"][number]["refType"],
  refId?: string
): AppState["activity"] {
  const event = {
    id: makeId("act"),
    type,
    message,
    at: Date.now(),
    refType,
    refId,
    read: false,
  };
  return [event, ...state.activity];
}

function findCustomer(state: AppState, info: { name: string; phone: string; email: string }): {
  customer: Customer;
  customers: Customer[];
} {
  const existing = state.customers.find(
    (c) => c.email.toLowerCase() === info.email.toLowerCase() && info.email.trim() !== ""
  );
  if (existing) {
    const updated: Customer = { ...existing, name: info.name, phone: info.phone };
    return {
      customer: updated,
      customers: state.customers.map((c) => (c.id === existing.id ? updated : c)),
    };
  }
  const customer: Customer = { id: makeId("cus"), name: info.name, phone: info.phone, email: info.email };
  return { customer, customers: [...state.customers, customer] };
}

function bumpBayStatusLabel(bay: Bay, status: JobStatus): string {
  const labels: Record<JobStatus, Partial<Record<Bay["kind"], string>>> = {
    queued: { dyno: "Queued", fabrication: "Queued", calibration: "Queued", detailing: "Queued" },
    in_progress: {
      dyno: "Live dyno pull",
      fabrication: "Fabrication in progress",
      calibration: "Calibration in progress",
      detailing: "Curing",
    },
    quality_check: {
      dyno: "Quality check",
      fabrication: "Quality check",
      calibration: "Quality check",
      detailing: "Quality check",
    },
    ready: {
      dyno: "Ready for collection",
      fabrication: "Ready for collection",
      calibration: "Ready for collection",
      detailing: "Ready for collection",
    },
    completed: { dyno: "Completed", fabrication: "Completed", calibration: "Completed", detailing: "Completed" },
  };
  return labels[status][bay.kind] ?? status;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "RESET":
      return resetState();

    case "SAVE_QUOTE": {
      const { quoteId, customer: customerInfo, vehicleId, packageId, optionalPartIds, notes, taxBps } =
        action.payload;
      const pkg = PACKAGES.find((p) => p.id === packageId);
      if (!pkg) return state;
      const { customer, customers } = findCustomer(state, customerInfo);
      const optionals = (OPTIONAL_CATALOG[vehicleId] ?? []).filter((p) => optionalPartIds.includes(p.id));
      const lines = buildQuoteLines(pkg, optionals);
      const totals = computeTotals(lines, taxBps);

      if (quoteId) {
        const existing = state.quotes.find((q) => q.id === quoteId);
        if (existing) {
          if (existing.status !== "draft") return state;
          const updated: Quote = {
            ...existing,
            customerId: customer.id,
            vehicleId,
            packageId,
            optionalPartIds,
            lines,
            notes,
            taxBps,
            ...totals,
          };
          return {
            ...state,
            customers,
            quotes: state.quotes.map((q) => (q.id === quoteId ? updated : q)),
          };
        }
      }

      const seq = state.seq.quote;
      const quote: Quote = {
        id: quoteId ?? makeId("quote"),
        ref: makeRef("QT", seq),
        customerId: customer.id,
        vehicleId,
        packageId,
        optionalPartIds,
        lines,
        notes,
        taxBps,
        status: "draft",
        createdAt: Date.now(),
        ...totals,
      };
      return {
        ...state,
        customers,
        quotes: [quote, ...state.quotes],
        seq: { ...state.seq, quote: seq + 1 },
        activity: pushActivity(
          state,
          "quote_created",
          `${quote.ref} created for ${customer.name} — vehicle spec quoted`,
          "quote",
          quote.id
        ),
      };
    }

    case "APPROVE_QUOTE": {
      const quote = state.quotes.find((q) => q.id === action.payload.quoteId);
      if (!quote || quote.status !== "draft") return state;
      const updated: Quote = { ...quote, status: "approved", approvedAt: Date.now() };
      return {
        ...state,
        quotes: state.quotes.map((q) => (q.id === quote.id ? updated : q)),
        activity: pushActivity(state, "quote_approved", `${quote.ref} approved`, "quote", quote.id),
      };
    }

    case "CONVERT_QUOTE_TO_JOB": {
      const quote = state.quotes.find((q) => q.id === action.payload.quoteId);
      if (!quote || quote.status !== "approved" || quote.convertedJobId) return state;
      const seq = state.seq.job;
      const ref = makeRef("JOB", seq);
      const job: Job = {
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
        status: "queued",
        blockedReason: null,
        checklist: [
          { id: makeId("chk"), label: "Pre-inspection & baseline dyno pull", done: false },
          { id: makeId("chk"), label: "Parts received & verified", done: false },
          { id: makeId("chk"), label: "Installation complete", done: false },
          { id: makeId("chk"), label: "Calibration deployed", done: false },
          { id: makeId("chk"), label: "Verification dyno pull", done: false },
          { id: makeId("chk"), label: "Road test", done: false },
          { id: makeId("chk"), label: "Final quality check", done: false },
        ],
        notes: [],
        statusTimeline: [{ status: "queued", at: Date.now() }],
        createdAt: Date.now(),
      };
      return {
        ...state,
        jobs: [job, ...state.jobs],
        seq: { ...state.seq, job: seq + 1 },
        quotes: state.quotes.map((q) => (q.id === quote.id ? { ...q, status: "converted", convertedJobId: job.id } : q)),
        activity: pushActivity(state, "quote_converted", `${quote.ref} converted to workshop job ${ref}`, "job", job.id),
      };
    }

    case "ASSIGN_JOB_TO_BAY": {
      const { jobId, bayId } = action.payload;
      const bay = state.bays.find((b) => b.id === bayId);
      const job = state.jobs.find((j) => j.id === jobId);
      if (!bay || !job) return state;
      if (bay.jobId && bay.jobId !== jobId) return state; // never silently overwrite an occupied bay
      const nextStatus: JobStatus = job.status === "queued" ? "in_progress" : job.status;
      return {
        ...state,
        bays: state.bays.map((b) =>
          b.id === bayId
            ? { ...b, jobId, statusLabel: bumpBayStatusLabel(b, nextStatus), enteredStageAt: Date.now(), blockedReason: null }
            : b
        ),
        jobs: state.jobs.map((j) =>
          j.id === jobId
            ? {
                ...j,
                bayId,
                status: nextStatus,
                statusTimeline:
                  nextStatus !== job.status ? [...j.statusTimeline, { status: nextStatus, at: Date.now() }] : j.statusTimeline,
              }
            : j
        ),
        activity: pushActivity(state, "vehicle_assigned", `${job.ref} assigned to Bay ${bay.number} — ${bay.name}`, "bay", bay.id),
      };
    }

    case "ASSIGN_TECHNICIAN": {
      const { bayId, technicianId } = action.payload;
      return {
        ...state,
        bays: state.bays.map((b) => (b.id === bayId ? { ...b, technicianId } : b)),
      };
    }

    case "UPDATE_JOB_STATUS": {
      const { jobId, status } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return state;
      const currentIdx = JOB_ORDER.indexOf(job.status);
      const nextIdx = JOB_ORDER.indexOf(status);
      if (nextIdx < currentIdx) return state; // forward-only workflow
      if (status === "completed") {
        const incomplete = job.checklist.filter((c) => !c.done);
        if (incomplete.length > 0) return state; // block: required work outstanding
      }
      const bay = state.bays.find((b) => b.id === job.bayId);
      return {
        ...state,
        jobs: state.jobs.map((j) =>
          j.id === jobId
            ? { ...j, status, statusTimeline: [...j.statusTimeline, { status, at: Date.now() }] }
            : j
        ),
        bays: bay
          ? state.bays.map((b) => (b.id === bay.id ? { ...b, statusLabel: bumpBayStatusLabel(b, status) } : b))
          : state.bays,
        activity:
          status === "completed"
            ? pushActivity(state, "job_completed", `${job.ref} marked completed`, "job", job.id)
            : pushActivity(state, "bay_status_changed", `${job.ref} moved to ${status.replace("_", " ")}`, "job", job.id),
      };
    }

    case "SET_BLOCKED": {
      const { jobId, reason } = action.payload;
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) return state;
      const bay = state.bays.find((b) => b.id === job.bayId);
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, blockedReason: reason } : j)),
        bays: bay
          ? state.bays.map((b) =>
              b.id === bay.id ? { ...b, blockedReason: reason, statusLabel: reason ? "Awaiting parts" : bumpBayStatusLabel(b, job.status) } : b
            )
          : state.bays,
        activity: reason
          ? pushActivity(state, "bay_status_changed", `${job.ref} blocked — ${reason}`, "job", job.id)
          : pushActivity(state, "parts_received", `${job.ref} unblocked — parts received`, "job", job.id),
      };
    }

    case "TOGGLE_CHECKLIST": {
      const { jobId, itemId } = action.payload;
      return {
        ...state,
        jobs: state.jobs.map((j) =>
          j.id === jobId
            ? { ...j, checklist: j.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) }
            : j
        ),
      };
    }

    case "ADD_NOTE": {
      const { jobId, text } = action.payload;
      if (!text.trim()) return state;
      const note = { id: makeId("note"), text: text.trim(), at: Date.now(), author: "Workshop Manager" };
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, notes: [note, ...j.notes] } : j)),
      };
    }

    case "RELEASE_BAY": {
      const bay = state.bays.find((b) => b.id === action.payload.bayId);
      if (!bay || !bay.jobId) return state;
      const job = state.jobs.find((j) => j.id === bay.jobId);
      if (!job || job.status !== "completed") return state; // only completed jobs release a bay
      return {
        ...state,
        bays: state.bays.map((b) =>
          b.id === bay.id
            ? { ...b, jobId: null, technicianId: null, statusLabel: "Available", enteredStageAt: Date.now(), blockedReason: null, estimatedReadyAt: null }
            : b
        ),
        jobs: state.jobs.map((j) => (j.id === job.id ? { ...j, bayId: null } : j)),
      };
    }

    case "CREATE_CALIBRATION_SESSION": {
      const { jobId, fileName, fileSizeBytes } = action.payload;
      const session = {
        id: makeId("cal"),
        jobId,
        fileName,
        fileSizeBytes,
        status: "reading" as CalibrationStatus,
        preset: "road" as CalibrationPreset,
        params: { launchRpm: 4200, burble: 2, limiterBypass: false },
        createdAt: Date.now(),
      };
      return {
        ...state,
        calibrationSessions: [session, ...state.calibrationSessions],
        jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, calibrationSessionId: session.id } : j)),
      };
    }

    case "SET_CALIBRATION_STATUS": {
      const { sessionId, status } = action.payload;
      return {
        ...state,
        calibrationSessions: state.calibrationSessions.map((s) => (s.id === sessionId ? { ...s, status } : s)),
      };
    }

    case "APPLY_PRESET": {
      const { sessionId, preset, params } = action.payload;
      return {
        ...state,
        calibrationSessions: state.calibrationSessions.map((s) =>
          s.id === sessionId ? { ...s, preset, params } : s
        ),
      };
    }

    case "SET_CALIBRATION_PARAMS": {
      const { sessionId, params, preset } = action.payload;
      return {
        ...state,
        calibrationSessions: state.calibrationSessions.map((s) =>
          s.id === sessionId ? { ...s, params: { ...s.params, ...params }, preset } : s
        ),
      };
    }

    case "DEPLOY_CALIBRATION_COMPLETE": {
      const session = state.calibrationSessions.find((s) => s.id === action.payload.sessionId);
      if (!session) return state;
      const job = state.jobs.find((j) => j.id === session.jobId);
      const bay = job ? state.bays.find((b) => b.id === job.bayId) : undefined;
      let nextActivity = state.activity;
      let jobs = state.jobs;
      let bays = state.bays;
      if (job) {
        jobs = state.jobs.map((j) =>
          j.id === job.id
            ? { ...j, checklist: j.checklist.map((c) => (c.label === "Calibration deployed" ? { ...c, done: true } : c)) }
            : j
        );
        nextActivity = pushActivity(
          state,
          "calibration_deployed",
          `Calibration deployed for ${job.ref}`,
          "job",
          job.id
        );
      }
      if (bay) {
        bays = state.bays.map((b) => (b.id === bay.id ? { ...b, statusLabel: "Calibration complete" } : b));
      }
      return {
        ...state,
        jobs,
        bays,
        calibrationSessions: state.calibrationSessions.map((s) =>
          s.id === session.id ? { ...s, status: "complete", deployedAt: Date.now() } : s
        ),
        activity: nextActivity,
      };
    }

    case "REMOVE_CALIBRATION_SESSION": {
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === action.payload.jobId ? { ...j, calibrationSessionId: undefined } : j)),
      };
    }

    case "GENERATE_INVOICE": {
      const job = state.jobs.find((j) => j.id === action.payload.jobId);
      if (!job || job.status !== "completed" || job.invoiceId) return state;
      const seq = state.seq.invoice;
      const invoice: Invoice = {
        id: makeId("inv"),
        ref: makeRef("INV", seq),
        jobId: job.id,
        customerId: job.customerId,
        vehicleId: job.vehicleId,
        lines: job.priceSnapshot.lines,
        subtotalFils: job.priceSnapshot.subtotalFils,
        taxBps: job.priceSnapshot.taxBps,
        taxFils: job.priceSnapshot.taxFils,
        totalFils: job.priceSnapshot.totalFils,
        paidFils: 0,
        status: "draft",
        createdAt: Date.now(),
        payments: [],
      };
      return {
        ...state,
        invoices: [invoice, ...state.invoices],
        jobs: state.jobs.map((j) => (j.id === job.id ? { ...j, invoiceId: invoice.id } : j)),
        seq: { ...state.seq, invoice: seq + 1 },
      };
    }

    case "ISSUE_INVOICE": {
      const invoice = state.invoices.find((i) => i.id === action.payload.invoiceId);
      if (!invoice || invoice.status !== "draft") return state;
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === invoice.id ? { ...i, status: "issued", issuedAt: Date.now() } : i)),
        activity: pushActivity(state, "invoice_issued", `${invoice.ref} issued`, "invoice", invoice.id),
      };
    }

    case "RECORD_PAYMENT": {
      const { invoiceId, amountFils, method } = action.payload;
      const invoice = state.invoices.find((i) => i.id === invoiceId);
      if (!invoice || amountFils <= 0) return state;
      const remaining = invoice.totalFils - invoice.paidFils;
      if (amountFils > remaining) return state; // prevent overpayment
      const payment: Payment = { id: makeId("pay"), invoiceId, amountFils, method, at: Date.now() };
      const paidFils = invoice.paidFils + amountFils;
      const status: Invoice["status"] = paidFils >= invoice.totalFils ? "paid" : "partially_paid";
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === invoiceId ? { ...i, paidFils, status, payments: [payment, ...i.payments] } : i
        ),
        activity: pushActivity(
          state,
          "payment_recorded",
          `Payment recorded on ${invoice.ref} (${method.replace("_", " ")})`,
          "invoice",
          invoice.id
        ),
      };
    }

    case "MARK_ACTIVITY_READ":
      return { ...state, activity: state.activity.map((a) => (a.id === action.payload.id ? { ...a, read: true } : a)) };

    case "MARK_ALL_ACTIVITY_READ":
      return { ...state, activity: state.activity.map((a) => ({ ...a, read: true })) };

    default:
      return state;
  }
}

// ----------------------------------------------------------------- context
interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStoreContext(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext must be used within StoreProvider");
  return ctx;
}

export function useAppState(): AppState {
  return useStoreContext().state;
}

export function useActions() {
  const { dispatch } = useStoreContext();
  return useMemo(
    () => ({
      reset: () => dispatch({ type: "RESET" }),
      saveQuote: (payload: Extract<Action, { type: "SAVE_QUOTE" }>["payload"]) =>
        dispatch({ type: "SAVE_QUOTE", payload }),
      approveQuote: (quoteId: string) => dispatch({ type: "APPROVE_QUOTE", payload: { quoteId } }),
      convertQuoteToJob: (quoteId: string) => dispatch({ type: "CONVERT_QUOTE_TO_JOB", payload: { quoteId } }),
      assignJobToBay: (jobId: string, bayId: string) => dispatch({ type: "ASSIGN_JOB_TO_BAY", payload: { jobId, bayId } }),
      assignTechnician: (bayId: string, technicianId: string | null) =>
        dispatch({ type: "ASSIGN_TECHNICIAN", payload: { bayId, technicianId } }),
      updateJobStatus: (jobId: string, status: JobStatus) => dispatch({ type: "UPDATE_JOB_STATUS", payload: { jobId, status } }),
      setBlocked: (jobId: string, reason: string | null) => dispatch({ type: "SET_BLOCKED", payload: { jobId, reason } }),
      toggleChecklist: (jobId: string, itemId: string) => dispatch({ type: "TOGGLE_CHECKLIST", payload: { jobId, itemId } }),
      addNote: (jobId: string, text: string) => dispatch({ type: "ADD_NOTE", payload: { jobId, text } }),
      releaseBay: (bayId: string) => dispatch({ type: "RELEASE_BAY", payload: { bayId } }),
      createCalibrationSession: (jobId: string, fileName: string, fileSizeBytes: number) =>
        dispatch({ type: "CREATE_CALIBRATION_SESSION", payload: { jobId, fileName, fileSizeBytes } }),
      setCalibrationStatus: (sessionId: string, status: CalibrationStatus) =>
        dispatch({ type: "SET_CALIBRATION_STATUS", payload: { sessionId, status } }),
      applyPreset: (sessionId: string, preset: CalibrationPreset, params: CalibrationParams) =>
        dispatch({ type: "APPLY_PRESET", payload: { sessionId, preset, params } }),
      setCalibrationParams: (sessionId: string, params: Partial<CalibrationParams>) =>
        dispatch({ type: "SET_CALIBRATION_PARAMS", payload: { sessionId, params, preset: "custom" } }),
      deployCalibrationComplete: (sessionId: string) =>
        dispatch({ type: "DEPLOY_CALIBRATION_COMPLETE", payload: { sessionId } }),
      removeCalibrationSession: (jobId: string) => dispatch({ type: "REMOVE_CALIBRATION_SESSION", payload: { jobId } }),
      generateInvoice: (jobId: string) => dispatch({ type: "GENERATE_INVOICE", payload: { jobId } }),
      issueInvoice: (invoiceId: string) => dispatch({ type: "ISSUE_INVOICE", payload: { invoiceId } }),
      recordPayment: (invoiceId: string, amountFils: number, method: Payment["method"]) =>
        dispatch({ type: "RECORD_PAYMENT", payload: { invoiceId, amountFils, method } }),
      markActivityRead: (id: string) => dispatch({ type: "MARK_ACTIVITY_READ", payload: { id } }),
      markAllActivityRead: () => dispatch({ type: "MARK_ALL_ACTIVITY_READ" }),
    }),
    [dispatch]
  );
}

export const DEFAULT_TAX_BPS = TAX_BPS_DEFAULT;

// --------------------------------------------------------------- selectors
export function useSearchIndex() {
  const state = useAppState();
  return useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      const results: { label: string; sub: string; href: string }[] = [];
      for (const job of state.jobs) {
        const vehicle = state.vehicles.find((v) => v.id === job.vehicleId);
        const customer = state.customers.find((c) => c.id === job.customerId);
        const hay = `${job.ref} ${vehicle?.make} ${vehicle?.model} ${customer?.name}`.toLowerCase();
        if (hay.includes(q)) {
          results.push({
            label: `${job.ref} — ${vehicle?.make} ${vehicle?.model}`,
            sub: `Workshop job · ${customer?.name}`,
            href: `/operations?job=${job.id}`,
          });
        }
      }
      for (const quote of state.quotes) {
        const vehicle = state.vehicles.find((v) => v.id === quote.vehicleId);
        const customer = state.customers.find((c) => c.id === quote.customerId);
        const hay = `${quote.ref} ${vehicle?.make} ${vehicle?.model} ${customer?.name}`.toLowerCase();
        if (hay.includes(q)) {
          results.push({
            label: `${quote.ref} — ${vehicle?.make} ${vehicle?.model}`,
            sub: `Quote · ${customer?.name} · ${quote.status}`,
            href: `/studio?quote=${quote.id}`,
          });
        }
      }
      for (const invoice of state.invoices) {
        const customer = state.customers.find((c) => c.id === invoice.customerId);
        const hay = `${invoice.ref} ${customer?.name}`.toLowerCase();
        if (hay.includes(q)) {
          results.push({
            label: `${invoice.ref}`,
            sub: `Invoice · ${customer?.name} · ${invoice.status}`,
            href: `/operations?invoice=${invoice.id}`,
          });
        }
      }
      for (const customer of state.customers) {
        if (customer.name.toLowerCase().includes(q)) {
          results.push({ label: customer.name, sub: "Customer", href: `/operations?customer=${customer.id}` });
        }
      }
      return results.slice(0, 8);
    },
    [state]
  );
}
