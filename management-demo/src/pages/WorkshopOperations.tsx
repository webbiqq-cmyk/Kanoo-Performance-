import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { TopBar } from "../components/shell/TopBar";
import { BayCard } from "../components/bay/BayCard";
import { JobPanel } from "../components/bay/JobPanel";
import { DynoTelemetry } from "../components/bay/DynoTelemetry";
import { Badge } from "../components/ui/Badge";
import { useAppState, useActions } from "../state/store";
import { formatBHD } from "../lib/money";

export function WorkshopOperations() {
  const state = useAppState();
  const actions = useActions();
  const [params, setParams] = useSearchParams();
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [customerFilter, setCustomerFilter] = useState<string | null>(params.get("customer"));

  useEffect(() => {
    const bayId = params.get("bay");
    const jobId = params.get("job");
    const invoiceId = params.get("invoice");
    if (jobId) {
      setOpenJobId(jobId);
    } else if (bayId) {
      const bay = state.bays.find((b) => b.id === bayId);
      if (bay?.jobId) setOpenJobId(bay.jobId);
    } else if (invoiceId) {
      const invoice = state.invoices.find((i) => i.id === invoiceId);
      if (invoice) setOpenJobId(invoice.jobId);
    }
    if (params.get("customer")) setCustomerFilter(params.get("customer"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const queuedUnassigned = state.jobs.filter((j) => j.status === "queued" && !j.bayId);
  const availableBays = state.bays.filter((b) => !b.jobId);

  const filteredJobs = customerFilter ? state.jobs.filter((j) => j.customerId === customerFilter) : state.jobs;
  const filterCustomer = customerFilter ? state.customers.find((c) => c.id === customerFilter) : undefined;

  function closePanel() {
    setOpenJobId(null);
    const next = new URLSearchParams(params);
    next.delete("job");
    next.delete("bay");
    setParams(next, { replace: true });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TopBar title="Workshop Operations" context="Live bay board — Kanoo Performance, Tubli" />
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {filterCustomer && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/8 px-3 py-2 text-xs text-cyan">
            Showing records for <strong>{filterCustomer.name}</strong>
            <button
              onClick={() => {
                setCustomerFilter(null);
                const next = new URLSearchParams(params);
                next.delete("customer");
                setParams(next, { replace: true });
              }}
              className="ml-1 rounded-full border border-cyan/40 p-0.5 hover:bg-cyan/15"
            >
              <X size={11} />
            </button>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">Workshop bays</h3>
          <span className="text-xs text-ink-faint">{state.bays.filter((b) => b.jobId).length}/4 occupied</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {state.bays.map((bay) => {
            const job = state.jobs.find((j) => j.id === bay.jobId);
            const vehicle = job ? state.vehicles.find((v) => v.id === job.vehicleId) : undefined;
            return (
              <BayCard
                key={bay.id}
                bay={bay}
                job={job}
                vehicle={vehicle}
                onClick={() => (job ? setOpenJobId(job.id) : undefined)}
                telemetry={bay.kind === "dyno" && job ? <DynoTelemetry /> : undefined}
              />
            );
          })}
        </div>

        {queuedUnassigned.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">
              Queue — awaiting bay assignment
            </h3>
            <div className="space-y-2">
              {queuedUnassigned.map((job) => {
                const vehicle = state.vehicles.find((v) => v.id === job.vehicleId)!;
                const customer = state.customers.find((c) => c.id === job.customerId)!;
                return (
                  <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {job.ref} — {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-xs text-ink-faint">{customer.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {availableBays.length === 0 ? (
                        <Badge tone="warn">No bay available</Badge>
                      ) : (
                        <select
                          className="rounded-lg border border-line-strong bg-elevated px-3 py-1.5 text-xs text-ink"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) actions.assignJobToBay(job.id, e.target.value);
                          }}
                        >
                          <option value="">Assign to bay…</option>
                          {availableBays.map((b) => (
                            <option key={b.id} value={b.id}>
                              Bay {b.number} — {b.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <button onClick={() => setOpenJobId(job.id)} className="text-xs text-cyan underline underline-offset-2">
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">All jobs</h3>
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-[11px] uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-2.5">Job</th>
                  <th className="px-4 py-2.5">Vehicle</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const vehicle = state.vehicles.find((v) => v.id === job.vehicleId)!;
                  const customer = state.customers.find((c) => c.id === job.customerId)!;
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setOpenJobId(job.id)}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2"
                    >
                      <td className="px-4 py-2.5 font-medium text-ink">{job.ref}</td>
                      <td className="px-4 py-2.5 text-ink-dim">
                        {vehicle.make} {vehicle.model}
                      </td>
                      <td className="px-4 py-2.5 text-ink-dim">{customer.name}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={job.status === "completed" ? "ok" : job.blockedReason ? "warn" : "cyan"}>
                          {job.blockedReason ? "Blocked" : job.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="tabular px-4 py-2.5 text-right text-ink">{formatBHD(job.priceSnapshot.totalFils)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <JobPanel jobId={openJobId} onClose={closePanel} />
    </div>
  );
}
