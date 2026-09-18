import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Gauge, Timer, Zap, FileSignature } from "lucide-react";
import { TopBar } from "../components/shell/TopBar";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { VehicleSilhouette } from "../components/vehicle/Silhouette";
import { PowerCurveChart } from "../components/charts/PowerCurveChart";
import { QuoteDrawer } from "../components/quote/QuoteDrawer";
import { useAppState } from "../state/store";
import { generatePowerCurve, generateTorqueCurve, powerGain, buildQuoteLines, computeTotals } from "../lib/calculations";
import { formatBHD } from "../lib/money";
import { OPTIONAL_CATALOG } from "../lib/seed";

export function PerformanceStudio() {
  const state = useAppState();
  const [params] = useSearchParams();
  const [vehicleId, setVehicleId] = useState(params.get("vehicle") ?? state.vehicles[0].id);
  const [tier, setTier] = useState<"stock" | "stage1" | "stage2" | "stage3">("stage2");
  const [optionalIds, setOptionalIds] = useState<string[]>([]);
  const [curveMode, setCurveMode] = useState<"hp" | "Nm">("hp");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const qid = params.get("quote");
    if (!qid) return;
    const q = state.quotes.find((x) => x.id === qid);
    if (!q) return;
    setVehicleId(q.vehicleId);
    const pkg = state.packages.find((p) => p.id === q.packageId);
    if (pkg) setTier(pkg.tier as typeof tier);
    setOptionalIds(q.optionalPartIds);
    setEditingQuoteId(q.status === "draft" ? q.id : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const vehicle = state.vehicles.find((v) => v.id === vehicleId)!;
  const pkg = useMemo(
    () => state.packages.find((p) => p.vehicleId === vehicleId && p.tier === tier)!,
    [state.packages, vehicleId, tier]
  );

  useEffect(() => setOptionalIds([]), [vehicleId]);

  const optionalCatalog = OPTIONAL_CATALOG[vehicleId] ?? [];
  const selectedOptionals = optionalCatalog.filter((o) => optionalIds.includes(o.id));
  const perfBonusHp = selectedOptionals.reduce((sum, o) => sum + (o.perfEffectHp ?? 0), 0);
  const effectiveHp = pkg.estHp + perfBonusHp;

  const gain = powerGain(vehicle, { ...pkg, estHp: effectiveHp });
  const stockPowerCurve = useMemo(() => generatePowerCurve(vehicle, vehicle.stockHp), [vehicle]);
  const selectedPowerCurve = useMemo(() => generatePowerCurve(vehicle, effectiveHp), [vehicle, effectiveHp]);
  const stockTorqueCurve = useMemo(() => generateTorqueCurve(vehicle, vehicle.stockTorqueNm), [vehicle]);
  const selectedTorqueCurve = useMemo(() => generateTorqueCurve(vehicle, pkg.estTorqueNm), [vehicle, pkg]);

  const lines = useMemo(() => buildQuoteLines(pkg, selectedOptionals), [pkg, selectedOptionals]);
  const totals = useMemo(() => computeTotals(lines, 1000), [lines]);

  function toggleOptional(id: string) {
    setOptionalIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TopBar title="Performance Studio" context={`${vehicle.make} ${vehicle.model} · ${pkg.name}`} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-28">
        <div className="grid gap-5 p-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Left: vehicle + chart */}
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {state.vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVehicleId(v.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    v.id === vehicleId ? "border-race bg-race/8" : "border-line bg-surface-2 hover:border-line-strong"
                  }`}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{v.year}</div>
                  <div className="mt-0.5 font-display text-sm font-semibold text-ink">
                    {v.make} {v.model}
                  </div>
                  <div className="mt-1 text-[11px] text-ink-faint">{v.engine}</div>
                </button>
              ))}
            </div>

            <section className="rounded-2xl border border-line bg-surface p-6">
              <VehicleSilhouette kind={vehicle.silhouette} accent={vehicle.accent} className="h-auto w-full" />
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
                <SpecItem label="Engine" value={vehicle.engine} />
                <SpecItem label="Drivetrain" value={vehicle.drivetrain} />
                <SpecItem label="Transmission" value={vehicle.transmission} />
                <SpecItem label="Stock 0–100 km/h" value={`${vehicle.stock0to100.toFixed(1)}s`} />
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">
                  Power &amp; torque curve
                </h3>
                <div className="flex rounded-lg border border-line p-0.5">
                  {(["hp", "Nm"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setCurveMode(m)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                        curveMode === m ? "bg-elevated text-ink" : "text-ink-faint"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <PowerCurveChart
                stock={curveMode === "hp" ? stockPowerCurve : stockTorqueCurve}
                selected={curveMode === "hp" ? selectedPowerCurve : selectedTorqueCurve}
                unit={curveMode}
                accent={vehicle.accent}
                redlineRpm={vehicle.redlineRpm}
              />
              <p className="mt-3 text-[11px] text-ink-faint">
                Curves are illustrative demo estimates, not dyno-verified data. Acceleration estimates reflect the
                package's combined output and supporting hardware, not horsepower alone.
              </p>
            </section>

            <section className="grid grid-cols-3 gap-3">
              <GainTile icon={Zap} label="Power gain" value={`+${gain.absoluteHp} hp`} sub={`${gain.percentHp.toFixed(0)}%`} />
              <GainTile icon={Gauge} label="Torque gain" value={`+${gain.absoluteNm} Nm`} sub={`${gain.percentNm.toFixed(0)}%`} />
              <GainTile icon={Timer} label="0–100 km/h" value={`${pkg.est0to100.toFixed(2)}s`} sub={`-${gain.accelDelta.toFixed(2)}s`} />
            </section>
          </div>

          {/* Right: package + hardware */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">Package</h3>
              <div className="space-y-2.5">
                {(["stock", "stage1", "stage2", "stage3"] as const).map((t) => {
                  const p = state.packages.find((x) => x.vehicleId === vehicleId && x.tier === t)!;
                  const active = t === tier;
                  return (
                    <button
                      key={t}
                      onClick={() => setTier(t)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        active ? "border-race bg-race/8" : "border-line bg-surface-2 hover:border-line-strong"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-semibold text-ink">{p.name}</span>
                        {active && <Badge tone="race">Selected</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-ink-dim">{p.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
                        <span className="tabular">{p.estHp} hp</span>
                        <span className="tabular">{p.estTorqueNm} Nm</span>
                        <span className="tabular">{p.est0to100.toFixed(2)}s 0–100</span>
                        {p.installHours > 0 && <span>{p.installHours}h install</span>}
                        {p.laborFils > 0 && <span className="tabular text-ink-dim">{formatBHD(p.laborFils)} labor</span>}
                      </div>
                      {p.fitmentNote && (
                        <div className="mt-2 rounded-md border border-warn/30 bg-warn/10 px-2.5 py-1.5 text-[11px] text-warn">
                          {p.fitmentNote}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {pkg.hardware.length > 0 && (
              <section className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">Hardware breakdown</h3>
                <div className="space-y-2">
                  {pkg.hardware.map((h) => (
                    <div key={h.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <div className="truncate text-ink">
                          {h.brand && <span className="text-ink-faint">{h.brand} · </span>}
                          {h.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-faint">
                          <span>Qty {h.qty}</span>
                          <AvailabilityBadge availability={h.availability} />
                          <span className="text-ink-faint">{h.required ? "Required" : "Optional"}</span>
                        </div>
                      </div>
                      <div className="tabular flex-none font-medium text-ink">{formatBHD(h.qty * h.unitPriceFils)}</div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-line pt-2.5 text-sm">
                    <span className="text-ink-dim">Installation labor ({pkg.installHours}h)</span>
                    <span className="tabular font-medium text-ink">{formatBHD(pkg.laborFils)}</span>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">Optional additions</h3>
              <div className="space-y-2">
                {optionalCatalog.map((o) => {
                  const on = optionalIds.includes(o.id);
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                        on ? "border-cyan/50 bg-cyan/8" : "border-line hover:border-line-strong"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={on} onChange={() => toggleOptional(o.id)} className="h-4 w-4 accent-[#38D9F5]" />
                        <div>
                          <div className="text-ink">{o.name}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-faint">
                            <AvailabilityBadge availability={o.availability} />
                            {typeof o.perfEffectHp === "number" && <span className="text-ok">+{o.perfEffectHp} hp effect</span>}
                          </div>
                        </div>
                      </div>
                      <span className="tabular flex-none font-medium text-ink">{formatBHD(o.unitPriceFils)}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Persistent quotation summary */}
      <div className="flex-none border-t border-line bg-surface/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Subtotal</div>
              <div className="tabular font-display text-lg font-semibold text-ink">{formatBHD(totals.subtotalFils)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Tax (10%, assumption)</div>
              <div className="tabular font-display text-lg font-semibold text-ink-dim">{formatBHD(totals.taxFils)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Total</div>
              <div className="tabular font-display text-xl font-semibold text-race">{formatBHD(totals.totalFils)}</div>
            </div>
          </div>
          <Button variant="primary" size="lg" onClick={() => setQuoteOpen(true)}>
            <FileSignature size={16} /> Build Quote
          </Button>
        </div>
      </div>

      <QuoteDrawer
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        vehicleId={vehicleId}
        packageId={pkg.id}
        optionalPartIds={optionalIds}
        editingQuoteId={editingQuoteId}
        onSaved={() => setEditingQuoteId(undefined)}
      />
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function GainTile({ icon: Icon, label, value, sub }: { icon: typeof Zap; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <Icon size={16} className="text-cyan" />
      <div className="tabular mt-2 font-display text-lg font-semibold text-ink">{value}</div>
      <div className="text-[11px] text-ink-faint">
        {label} · <span className="text-ok">{sub}</span>
      </div>
    </div>
  );
}

function AvailabilityBadge({ availability }: { availability: "in-stock" | "on-order" | "fitment-required" }) {
  const tone = availability === "in-stock" ? "ok" : availability === "on-order" ? "warn" : "race";
  const label = availability === "in-stock" ? "In stock" : availability === "on-order" ? "On order" : "Fitment required";
  return <Badge tone={tone}>{label}</Badge>;
}
