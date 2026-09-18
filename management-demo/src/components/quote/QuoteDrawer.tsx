import { useState, type ReactNode } from "react";
import { CheckCircle2, Printer, ArrowRight } from "lucide-react";
import { Overlay } from "../ui/Overlay";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { QuoteDocument } from "./QuoteDocument";
import { useAppState, useActions } from "../../state/store";
import { makeId } from "../../lib/id";
import { formatBHD } from "../../lib/money";
import { useToast } from "../ui/Toast";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  packageId: string;
  optionalPartIds: string[];
  editingQuoteId?: string;
  onSaved?: (quoteId: string) => void;
}

export function QuoteDrawer({ open, onClose, vehicleId, packageId, optionalPartIds, editingQuoteId, onSaved }: Props) {
  const state = useAppState();
  const actions = useActions();
  const toast = useToast();
  const navigate = useNavigate();

  const [draftId] = useState(() => editingQuoteId ?? makeId("quote"));
  const existingQuote = editingQuoteId ? state.quotes.find((q) => q.id === editingQuoteId) : undefined;
  const existingCustomer = existingQuote ? state.customers.find((c) => c.id === existingQuote.customerId) : undefined;

  const [name, setName] = useState(existingCustomer?.name ?? "");
  const [phone, setPhone] = useState(existingCustomer?.phone ?? "");
  const [email, setEmail] = useState(existingCustomer?.email ?? "");
  const [notes, setNotes] = useState(existingQuote?.notes ?? "");
  const [taxBps] = useState(1000);

  const savedQuote = state.quotes.find((q) => q.id === draftId);
  const vehicle = state.vehicles.find((v) => v.id === vehicleId)!;
  const pkg = state.packages.find((p) => p.id === packageId)!;
  const customer = savedQuote ? state.customers.find((c) => c.id === savedQuote.customerId) : undefined;
  const job = savedQuote?.convertedJobId ? state.jobs.find((j) => j.id === savedQuote.convertedJobId) : undefined;

  const canSave = name.trim().length > 1 && phone.trim().length > 3;

  function handleSave() {
    actions.saveQuote({
      quoteId: draftId,
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      vehicleId,
      packageId,
      optionalPartIds,
      notes,
      taxBps,
    });
    toast.show(savedQuote ? "Quote updated" : "Quote saved as draft", "ok");
    onSaved?.(draftId);
  }

  function handleApprove() {
    if (!savedQuote) return;
    actions.approveQuote(savedQuote.id);
    toast.show(`${savedQuote.ref} approved`, "ok");
  }

  function handleConvert() {
    if (!savedQuote) return;
    actions.convertQuoteToJob(savedQuote.id);
    toast.show(`${savedQuote.ref} converted to a workshop job`, "ok");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <Overlay
        open={open}
        onClose={onClose}
        title="Build Quote"
        subtitle={`${vehicle.make} ${vehicle.model} · ${pkg.name}`}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Total</div>
              <div className="tabular font-display text-lg font-semibold text-race">
                {formatBHD(savedQuote?.totalFils ?? 0)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedQuote && (
                <Button variant="ghost" onClick={handlePrint}>
                  <Printer size={15} /> Print
                </Button>
              )}
              {!savedQuote && (
                <Button variant="primary" disabled={!canSave} onClick={handleSave}>
                  Save Quote
                </Button>
              )}
              {savedQuote?.status === "draft" && (
                <>
                  <Button variant="secondary" disabled={!canSave} onClick={handleSave}>
                    Save changes
                  </Button>
                  <Button variant="primary" onClick={handleApprove}>
                    <CheckCircle2 size={15} /> Approve Quote
                  </Button>
                </>
              )}
              {savedQuote?.status === "approved" && (
                <Button variant="primary" onClick={handleConvert}>
                  Convert to Workshop Job <ArrowRight size={15} />
                </Button>
              )}
              {savedQuote?.status === "converted" && job && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    navigate(`/operations?job=${job.id}`);
                  }}
                >
                  Open {job.ref} in Workshop Operations <ArrowRight size={15} />
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {savedQuote && (
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{savedQuote.ref}</Badge>
              <Badge tone={savedQuote.status === "draft" ? "warn" : savedQuote.status === "approved" ? "cyan" : "ok"}>
                {savedQuote.status}
              </Badge>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Khalid Mattar"
                className="w-full rounded-lg border border-line-strong bg-elevated px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-cyan/60 focus:outline-none"
              />
            </Field>
            <Field label="Phone" required>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+973 3xxx xxxx"
                className="w-full rounded-lg border border-line-strong bg-elevated px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-cyan/60 focus:outline-none"
              />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full rounded-lg border border-line-strong bg-elevated px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-cyan/60 focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any specifics for the workshop team…"
              className="w-full rounded-lg border border-line-strong bg-elevated px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-cyan/60 focus:outline-none"
            />
          </Field>

          <div className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Itemized</div>
            <div className="space-y-1.5">
              {(savedQuote?.lines ?? []).map((l) => (
                <div key={l.id} className="flex justify-between text-xs">
                  <span className="text-ink-dim">
                    {l.name} {l.qty > 1 && `×${l.qty}`}
                  </span>
                  <span className="tabular text-ink">{formatBHD(l.lineTotalFils)}</span>
                </div>
              ))}
              {!savedQuote && <div className="text-xs text-ink-faint">Save the quote to lock in itemized pricing.</div>}
            </div>
            {savedQuote && (
              <div className="mt-3 space-y-1 border-t border-line pt-2 text-xs">
                <div className="flex justify-between text-ink-dim">
                  <span>Subtotal</span>
                  <span className="tabular">{formatBHD(savedQuote.subtotalFils)}</span>
                </div>
                <div className="flex justify-between text-ink-dim">
                  <span>Tax ({(savedQuote.taxBps / 100).toFixed(1)}%, assumption)</span>
                  <span className="tabular">{formatBHD(savedQuote.taxFils)}</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-ink-faint">
            Performance figures, availability, and pricing are illustrative demo data.
          </p>
        </div>
      </Overlay>

      {savedQuote && customer && (
        <QuoteDocument quote={savedQuote} customer={customer} vehicle={vehicle} pkg={pkg} kind="Quotation" />
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {label} {required && <span className="text-race">*</span>}
      </span>
      {children}
    </label>
  );
}
