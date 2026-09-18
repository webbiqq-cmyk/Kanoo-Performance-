import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Briefcase, Layers, FileClock, Wallet } from "lucide-react";
import { TopBar } from "../components/shell/TopBar";
import { Metric } from "../components/ui/Metric";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { BayCard } from "../components/bay/BayCard";
import { VehicleSilhouette } from "../components/vehicle/Silhouette";
import { useAppState } from "../state/store";
import { formatBHD } from "../lib/money";

function timeAgo(at: number): string {
  const diff = Date.now() - at;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function CommandCentre() {
  const state = useAppState();
  const navigate = useNavigate();

  const featuredVehicle = state.vehicles.find((v) => v.id === "veh_911ts")!;
  const featuredJob = state.jobs.find((j) => j.vehicleId === featuredVehicle.id && j.status !== "completed");
  const featuredPkg = featuredJob ? state.packages.find((p) => p.id === featuredJob.packageId) : undefined;
  const featuredBay = featuredJob ? state.bays.find((b) => b.id === featuredJob.bayId) : undefined;

  const activeJobs = state.jobs.filter((j) => j.status !== "completed").length;
  const occupiedBays = state.bays.filter((b) => b.jobId).length;
  const quotesAwaitingApproval = state.quotes.filter((q) => q.status === "draft").length;
  const unpaidFils = state.invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + (i.totalFils - i.paidFils), 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TopBar title="Command Centre" context="Live operational overview — Kanoo Performance, Tubli" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-5 p-6 xl:grid-cols-[1.55fr_1fr]">
          {/* Featured vehicle */}
          <section className="relative overflow-hidden rounded-2xl border border-line bg-surface grid-texture">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_20%_0%,rgba(240,68,56,0.12),transparent_60%)]" />
            <div className="relative flex flex-col gap-6 p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="race" dot>
                  Featured Build
                </Badge>
                {featuredJob && <Badge tone="neutral">{featuredJob.ref}</Badge>}
              </div>

              <div>
                <h2 className="font-display text-3xl font-bold tracking-wide text-ink">
                  {featuredVehicle.make} {featuredVehicle.model}
                </h2>
                <p className="mt-1 text-sm text-ink-dim">{featuredVehicle.tagline}</p>
              </div>

              <div className="rounded-xl border border-line bg-canvas/60 px-4 py-3">
                <VehicleSilhouette kind={featuredVehicle.silhouette} accent={featuredVehicle.accent} className="h-auto w-full max-w-xl" />
              </div>

              <div className="flex flex-wrap items-end gap-8">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-faint">Current package</div>
                  <div className="mt-1 font-display text-lg font-semibold text-ink">{featuredPkg?.name ?? "—"}</div>
                </div>
                <div className="flex items-baseline gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-ink-faint">Stock</div>
                    <div className="tabular text-xl font-semibold text-ink-dim">{featuredVehicle.stockHp} hp</div>
                  </div>
                  <ArrowUpRight className="text-race" size={18} />
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-ink-faint">Estimated tuned</div>
                    <div className="tabular text-xl font-semibold text-race">{featuredPkg?.estHp ?? featuredVehicle.stockHp} hp</div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-faint">Workflow status</div>
                  <div className="mt-1">
                    <Badge tone="cyan">{featuredBay?.statusLabel ?? featuredJob?.status.replace("_", " ") ?? "—"}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Button variant="primary" size="lg" onClick={() => navigate(`/studio?vehicle=${featuredVehicle.id}`)}>
                  Open Performance Studio <ArrowUpRight size={16} />
                </Button>
              </div>
            </div>
          </section>

          {/* Operational summary */}
          <section className="grid grid-rows-[auto_1fr] gap-5">
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-surface p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-elevated text-cyan">
                  <Briefcase size={16} />
                </span>
                <Metric label="Active jobs" value={activeJobs} tone="cyan" size="sm" />
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-elevated text-race">
                  <Layers size={16} />
                </span>
                <Metric label="Bays occupied" value={occupiedBays} suffix="/ 4" tone="race" size="sm" />
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-elevated text-warn">
                  <FileClock size={16} />
                </span>
                <Metric label="Quotes awaiting approval" value={quotesAwaitingApproval} tone="ink" size="sm" />
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-elevated text-ok">
                  <Wallet size={16} />
                </span>
                <div>
                  <div className="tabular font-display text-xl font-semibold text-ink">{formatBHD(unpaidFils)}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-faint">Unpaid invoice value</div>
                </div>
              </div>
            </div>

            <div className="min-h-0 rounded-2xl border border-line bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">Activity</h3>
                <Badge tone="neutral">{state.activity.filter((a) => !a.read).length} new</Badge>
              </div>
              <ul className="space-y-2.5 overflow-y-auto" style={{ maxHeight: 220 }}>
                {state.activity.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${a.read ? "bg-line-strong" : "bg-cyan"}`} />
                    <div>
                      <p className="text-ink-dim">{a.message}</p>
                      <p className="text-[11px] text-ink-faint">{timeAgo(a.at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Bay overview */}
        <div className="px-6 pb-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">Workshop bays</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/operations")}>
              Open Workshop Operations <ArrowUpRight size={14} />
            </Button>
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
                  compact
                  onClick={() => navigate(`/operations?bay=${bay.id}`)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
