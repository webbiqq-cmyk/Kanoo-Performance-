import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, FileText, Printer, Send, ArrowRight, Lock } from "lucide-react";
import { Overlay } from "../ui/Overlay";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { QuoteDocument } from "../quote/QuoteDocument";
import { useAppState, useActions } from "../../state/store";
import { formatBHD } from "../../lib/money";
import { useToast } from "../ui/Toast";
import type { JobStatus, Payment } from "../../lib/types";

const NEXT_STATUS: Record<JobStatus, JobStatus | null> = {
  queued: "in_progress",
  in_progress: "quality_check",
  quality_check: "ready",
  ready: "completed",
  completed: null,
};

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "Queued",
  in_progress: "In progress",
  quality_check: "Quality check",
  ready: "Ready for collection",
  completed: "Completed",
};

export function JobPanel({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  const state = useAppState();
  const actions = useActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<Payment["method"]>("card");

  const job = jobId ? state.jobs.find((j) => j.id === jobId) : undefined;
  if (!job) return null;

  const vehicle = state.vehicles.find((v) => v.id === job.vehicleId)!;
  const pkg = state.packages.find((p) => p.id === job.packageId)!;
  const customer = state.customers.find((c) => c.id === job.customerId)!;
  const bay = state.bays.find((b) => b.id === job.bayId);
  const invoice = job.invoiceId ? state.invoices.find((i) => i.id === job.invoiceId) : undefined;
  const availableBays = state.bays.filter((b) => !b.jobId && b.id !== job.bayId);
  const incompleteRequired = job.checklist.filter((c) => !c.done);
  const nextStatus = NEXT_STATUS[job.status];

  function advance() {
    if (!nextStatus) return;
    if (nextStatus === "completed" && incompleteRequired.length > 0) {
      toast.show("Complete the checklist before marking this job completed", "warn");
      return;
    }
    actions.updateJobStatus(job!.id, nextStatus);
    toast.show(`${job!.ref} moved to ${STATUS_LABEL[nextStatus]}`, "ok");
  }

  function handleGenerateInvoice() {
    actions.generateInvoice(job!.id);
    toast.show(`Draft invoice created for ${job!.ref}`, "ok");
  }

  function handleIssue() {
    if (!invoice) return;
    actions.issueInvoice(invoice.id);
    toast.show(`${invoice.ref} issued`, "ok");
  }

  function handlePayment() {
    if (!invoice) return;
    const bhd = Number(payAmount);
    if (!Number.isFinite(bhd) || bhd <= 0) {
      toast.show("Enter a valid payment amount", "warn");
      return;
    }
    const amountFils = Math.round(bhd * 1000);
    const remaining = invoice.totalFils - invoice.paidFils;
    if (amountFils > remaining) {
      toast.show(`Payment exceeds the outstanding balance of ${formatBHD(remaining)}`, "warn");
      return;
    }
    actions.recordPayment(invoice.id, amountFils, payMethod);
    setPayAmount("");
    toast.show("Payment recorded", "ok");
  }

  return (
    <>
      <Overlay
        open={!!jobId}
        onClose={onClose}
        title={job.ref}
        subtitle={`${vehicle.make} ${vehicle.model} · ${pkg.name}`}
        width="min(620px, 100vw)"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge tone={job.status === "completed" ? "ok" : "cyan"}>{STATUS_LABEL[job.status]}</Badge>
            <div className="flex flex-wrap gap-2">
              {nextStatus && (
                <Button variant="primary" onClick={advance} disabled={!!job.blockedReason}>
                  Move to {STATUS_LABEL[nextStatus]} <ArrowRight size={15} />
                </Button>
              )}
              {job.status === "completed" && bay && (
                <Button variant="secondary" onClick={() => actions.releaseBay(bay.id)}>
                  Release bay
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Customer & vehicle */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Customer &amp; vehicle</h4>
            <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm">
              <div className="font-medium text-ink">{customer.name}</div>
              <div className="text-ink-faint">
                {customer.phone} · {customer.email}
              </div>
              <div className="mt-2 border-t border-line pt-2 text-ink-dim">
                {vehicle.year} {vehicle.make} {vehicle.model} — {pkg.name}
              </div>
            </div>
          </section>

          {/* Bay & technician */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Bay &amp; technician</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="text-[11px] text-ink-faint">Bay</div>
                <div className="mt-0.5 text-sm text-ink">{bay ? `${bay.number} — ${bay.name}` : "Unassigned"}</div>
                {availableBays.length > 0 && job.status !== "completed" && (
                  <select
                    className="mt-2 w-full rounded-md border border-line-strong bg-elevated px-2 py-1.5 text-xs text-ink"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        actions.assignJobToBay(job.id, e.target.value);
                        toast.show(`${job.ref} moved to Bay ${state.bays.find((b) => b.id === e.target.value)?.number}`, "ok");
                      }
                    }}
                  >
                    <option value="">{bay ? "Move to bay…" : "Assign to bay…"}</option>
                    {availableBays.map((b) => (
                      <option key={b.id} value={b.id}>
                        Bay {b.number} — {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="text-[11px] text-ink-faint">Technician</div>
                <select
                  disabled={!bay}
                  value={bay?.technicianId ?? ""}
                  onChange={(e) => bay && actions.assignTechnician(bay.id, e.target.value || null)}
                  className="mt-1 w-full rounded-md border border-line-strong bg-elevated px-2 py-1.5 text-xs text-ink disabled:opacity-40"
                >
                  <option value="">Unassigned</option>
                  {state.technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Blocked state */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Blockers</h4>
            {job.blockedReason ? (
              <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm text-warn">
                <div className="flex items-start justify-between gap-3">
                  <span>{job.blockedReason}</span>
                  <Button size="sm" variant="secondary" onClick={() => actions.setBlocked(job.id, null)}>
                    Mark parts received
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Awaiting front splitter — on order"
                  className="flex-1 rounded-lg border border-line-strong bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-cyan/60 focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!blockReason.trim()}
                  onClick={() => {
                    actions.setBlocked(job.id, blockReason.trim());
                    setBlockReason("");
                  }}
                >
                  Block
                </Button>
              </div>
            )}
          </section>

          {/* Checklist */}
          <section>
            <h4 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-faint">
              <span>Work checklist</span>
              <span>
                {job.checklist.filter((c) => c.done).length}/{job.checklist.length}
              </span>
            </h4>
            <ul className="space-y-1.5">
              {job.checklist.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => actions.toggleChecklist(job.id, c.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-left text-sm hover:border-line-strong"
                  >
                    {c.done ? <CheckCircle2 size={16} className="flex-none text-ok" /> : <Circle size={16} className="flex-none text-ink-faint" />}
                    <span className={c.done ? "text-ink-dim line-through" : "text-ink"}>{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Parts */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Parts &amp; availability</h4>
            <div className="space-y-1.5">
              {job.priceSnapshot.lines
                .filter((l) => l.kind !== "labor")
                .map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-xs">
                    <span className="text-ink-dim">{l.name}</span>
                    <Badge tone={l.availability === "in-stock" ? "ok" : l.availability === "on-order" ? "warn" : "race"}>
                      {l.availability ?? "—"}
                    </Badge>
                  </div>
                ))}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Status timeline</h4>
            <ol className="space-y-1.5 border-l border-line pl-4">
              {job.statusTimeline.map((s, i) => (
                <li key={i} className="text-xs text-ink-dim">
                  <span className="font-medium text-ink">{STATUS_LABEL[s.status]}</span> — {new Date(s.at).toLocaleString()}
                </li>
              ))}
            </ol>
          </section>

          {/* Notes */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Notes</h4>
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a timestamped note…"
                className="flex-1 rounded-lg border border-line-strong bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-cyan/60 focus:outline-none"
              />
              <Button
                size="sm"
                variant="ghost"
                disabled={!note.trim()}
                onClick={() => {
                  actions.addNote(job.id, note);
                  setNote("");
                }}
              >
                Add
              </Button>
            </div>
            <ul className="mt-3 space-y-2">
              {job.notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-ink-dim">
                  {n.text}
                  <div className="mt-1 text-[10px] text-ink-faint">
                    {n.author} · {new Date(n.at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Financial summary */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Financial summary</h4>
            <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm">
              <div className="flex justify-between py-1 text-ink-dim">
                <span>Subtotal</span>
                <span className="tabular">{formatBHD(job.priceSnapshot.subtotalFils)}</span>
              </div>
              <div className="flex justify-between py-1 text-ink-dim">
                <span>Tax</span>
                <span className="tabular">{formatBHD(job.priceSnapshot.taxFils)}</span>
              </div>
              <div className="flex justify-between border-t border-line py-2 font-semibold text-ink">
                <span>Total</span>
                <span className="tabular">{formatBHD(job.priceSnapshot.totalFils)}</span>
              </div>

              {!invoice && job.status === "completed" && (
                <Button className="mt-3 w-full" variant="primary" onClick={handleGenerateInvoice}>
                  <FileText size={15} /> Generate invoice
                </Button>
              )}
              {!invoice && job.status !== "completed" && (
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-faint">
                  <Lock size={12} /> Invoice available once this job is completed.
                </div>
              )}

              {invoice && (
                <div className="mt-3 space-y-3 border-t border-line pt-3">
                  <div className="flex items-center justify-between">
                    <Badge tone="neutral">{invoice.ref}</Badge>
                    <Badge tone={invoice.status === "paid" ? "ok" : invoice.status === "partially_paid" ? "warn" : "cyan"}>
                      {invoice.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-ink-dim">
                    <span>Paid</span>
                    <span className="tabular text-ok">{formatBHD(invoice.paidFils)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-ink">
                    <span>Balance</span>
                    <span className="tabular">{formatBHD(invoice.totalFils - invoice.paidFils)}</span>
                  </div>

                  <div className="flex gap-2">
                    {invoice.status === "draft" ? (
                      <Button size="sm" variant="primary" onClick={handleIssue}>
                        <Send size={13} /> Issue invoice
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => window.print()}>
                        <Printer size={13} /> Print invoice
                      </Button>
                    )}
                  </div>

                  {invoice.status !== "draft" && invoice.status !== "paid" && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min={0}
                        step={0.001}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Amount (BHD)"
                        className="w-28 rounded-lg border border-line-strong bg-elevated px-2 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-cyan/60 focus:outline-none"
                      />
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as Payment["method"])}
                        className="rounded-lg border border-line-strong bg-elevated px-2 py-1.5 text-xs text-ink"
                      >
                        <option value="card">Card</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank transfer</option>
                      </select>
                      <Button size="sm" variant="secondary" onClick={handlePayment}>
                        Record payment
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <button
            onClick={() => navigate(`/studio?quote=${job.quoteId}`)}
            className="text-xs text-cyan underline underline-offset-2"
          >
            View originating quote {state.quotes.find((q) => q.id === job.quoteId)?.ref}
          </button>
        </div>
      </Overlay>

      {invoice && (
        <QuoteDocument
          quote={{ ...invoice, notes: "" }}
          customer={customer}
          vehicle={vehicle}
          pkg={pkg}
          kind="Invoice"
          invoiceRef={invoice.ref}
          paidFils={invoice.paidFils}
        />
      )}
    </>
  );
}
