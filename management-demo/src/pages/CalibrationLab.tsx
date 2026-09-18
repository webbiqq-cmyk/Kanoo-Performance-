import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UploadCloud, FileCode2, CheckCircle2, Loader2, RotateCcw, Rocket, ShieldAlert } from "lucide-react";
import { TopBar } from "../components/shell/TopBar";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useAppState, useActions } from "../state/store";
import { useToast } from "../components/ui/Toast";
import type { CalibrationPreset, CalibrationParams, CalibrationStatus } from "../lib/types";

const PRESETS: Record<Exclude<CalibrationPreset, "custom">, CalibrationParams> = {
  road: { launchRpm: 3400, burble: 1, limiterBypass: false },
  sport: { launchRpm: 4300, burble: 3, limiterBypass: false },
  track: { launchRpm: 5200, burble: 5, limiterBypass: true },
};

const STAGES: { key: CalibrationStatus; label: string }[] = [
  { key: "reading", label: "Reading file metadata" },
  { key: "integrity_check", label: "Simulating integrity check" },
  { key: "loading_profile", label: "Loading demo calibration profile" },
  { key: "ready", label: "Ready for simulated deployment" },
];

const MAX_BYTES = 8 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function CalibrationLab() {
  const state = useAppState();
  const actions = useActions();
  const toast = useToast();
  const [params] = useSearchParams();

  const activeJobs = useMemo(() => state.jobs.filter((j) => j.status !== "completed"), [state.jobs]);
  const [jobId, setJobId] = useState(params.get("job") ?? activeJobs[0]?.id ?? "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);

  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const session = state.calibrationSessions.find((s) => s.id === sessionId);
  const job = state.jobs.find((j) => j.id === jobId);
  const vehicle = job ? state.vehicles.find((v) => v.id === job.vehicleId) : undefined;

  function runIntake(jId: string, fileName: string, fileSizeBytes: number) {
    clearTimers();
    actions.createCalibrationSession(jId, fileName, fileSizeBytes);
    // session id isn't known synchronously; find it right after dispatch via a microtask-safe lookup
    const newId = `pending`;
    setSessionId(newId);
  }

  // Because reducer generates the session id internally, resolve it from state once created.
  useEffect(() => {
    if (sessionId !== "pending") return;
    const latest = [...state.calibrationSessions].sort((a, b) => b.createdAt - a.createdAt)[0];
    if (latest && latest.jobId === jobId) {
      setSessionId(latest.id);
      const sequence: CalibrationStatus[] = ["reading", "integrity_check", "loading_profile", "ready"];
      let delay = 700;
      sequence.slice(1).forEach((status, i) => {
        const t = window.setTimeout(() => {
          actions.setCalibrationStatus(latest.id, status);
        }, delay * (i + 1));
        timers.current.push(t);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, state.calibrationSessions]);

  function validateAndLoad(file: File) {
    setError(null);
    if (!jobId) {
      setError("Select a linked workshop job before loading a file.");
      return;
    }
    const okExt = /\.(bin|hex)$/i.test(file.name);
    if (!okExt) {
      setError("Unsupported file type — expected a .bin or .hex ECU file.");
      return;
    }
    if (file.size === 0) {
      setError("That file is empty.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File is too large for the demo intake (max ${formatBytes(MAX_BYTES)}).`);
      return;
    }
    runIntake(jobId, file.name, file.size);
  }

  function loadSample() {
    setError(null);
    if (!jobId) {
      setError("Select a linked workshop job before loading a file.");
      return;
    }
    runIntake(jobId, "KP-DemoCalibration-Stage2.bin", 512 * 1024);
  }

  function reset() {
    clearTimers();
    setSessionId(null);
    setDeployProgress(0);
    setError(null);
    if (job) actions.removeCalibrationSession(job.id);
  }

  function applyPreset(preset: Exclude<CalibrationPreset, "custom">) {
    if (!session) return;
    actions.applyPreset(session.id, preset, PRESETS[preset]);
  }

  function updateParam(patch: Partial<CalibrationParams>) {
    if (!session) return;
    actions.setCalibrationParams(session.id, patch);
  }

  function deploy() {
    if (!session || session.status !== "ready" || !job) return;
    actions.setCalibrationStatus(session.id, "deploying");
    setDeployProgress(0);
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const t = window.setTimeout(() => {
        setDeployProgress(Math.round((i / steps) * 100));
        if (i === steps) {
          actions.deployCalibrationComplete(session.id);
          toast.show(`Calibration deployed to ${job.ref}`, "ok");
        }
      }, i * 90);
      timers.current.push(t);
    }
  }

  const stageIndex = session ? STAGES.findIndex((s) => s.key === session.status) : -1;
  const isBusy = session ? ["reading", "integrity_check", "loading_profile"].includes(session.status) : false;
  const isDeploying = session?.status === "deploying";
  const isComplete = session?.status === "complete";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TopBar title="Calibration Lab" context={job ? `Linked to ${job.ref} — ${vehicle?.make} ${vehicle?.model}` : "No job linked"} />
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/8 px-4 py-2.5 text-xs font-medium text-cyan">
          <ShieldAlert size={14} />
          Simulation environment — no vehicle connection.
        </div>

        <div className="mb-5 max-w-sm">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-faint">Linked workshop job</label>
          <select
            value={jobId}
            disabled={isDeploying}
            onChange={(e) => {
              setJobId(e.target.value);
              reset();
            }}
            className="w-full rounded-lg border border-line-strong bg-elevated px-3 py-2.5 text-sm text-ink focus:border-cyan/60 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select a job…</option>
            {activeJobs.map((j) => {
              const v = state.vehicles.find((vv) => vv.id === j.vehicleId);
              return (
                <option key={j.id} value={j.id}>
                  {j.ref} — {v?.make} {v?.model}
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          {/* File intake */}
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">File intake</h3>

            {!session ? (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) validateAndLoad(file);
                  }}
                  className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
                    dragOver ? "border-cyan bg-cyan/8" : "border-line-strong"
                  }`}
                >
                  <UploadCloud size={28} className="text-ink-faint" />
                  <div className="text-sm text-ink-dim">Drag &amp; drop a .bin or .hex ECU file, or</div>
                  <label className="cursor-pointer">
                    <span className="rounded-lg border border-line-strong bg-elevated px-4 py-2 text-sm font-medium text-ink hover:border-line-strong">
                      Choose file
                    </span>
                    <input
                      type="file"
                      accept=".bin,.hex"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) validateAndLoad(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button onClick={loadSample} className="text-xs font-medium text-cyan underline underline-offset-2">
                    Load sample ECU file
                  </button>
                </div>
                {error && (
                  <div className="mt-3 rounded-lg border border-race/30 bg-race/10 px-3 py-2 text-xs text-race">{error}</div>
                )}
              </>
            ) : (
              <div>
                <div className="flex items-center gap-3 rounded-lg border border-line-strong bg-elevated px-4 py-3">
                  <FileCode2 size={20} className="flex-none text-cyan" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{session.fileName}</div>
                    <div className="text-xs text-ink-faint">{formatBytes(session.fileSizeBytes)}</div>
                  </div>
                  <button
                    onClick={reset}
                    disabled={isDeploying}
                    className="rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-dim hover:text-ink disabled:opacity-40"
                  >
                    Replace
                  </button>
                </div>

                <ol className="mt-5 space-y-3">
                  {STAGES.map((s, i) => {
                    const done = stageIndex > i || isComplete || isDeploying;
                    const active = stageIndex === i && !isComplete && !isDeploying;
                    return (
                      <li key={s.key} className="flex items-center gap-3 text-sm">
                        {done ? (
                          <CheckCircle2 size={16} className="flex-none text-ok" />
                        ) : active ? (
                          <Loader2 size={16} className="flex-none animate-spin text-cyan" />
                        ) : (
                          <span className="h-4 w-4 flex-none rounded-full border border-line-strong" />
                        )}
                        <span className={done ? "text-ink" : active ? "text-ink" : "text-ink-faint"}>{s.label}</span>
                      </li>
                    );
                  })}
                </ol>

                {isBusy && (
                  <p className="mt-3 text-xs text-ink-faint">Running staged simulation…</p>
                )}
                {(session.status === "ready" || isDeploying || isComplete) && (
                  <div className="mt-4 rounded-lg border border-ok/30 bg-ok/8 px-3 py-2 text-xs text-ok">
                    File verified for this demo session. Linked to {job?.ref}.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Parameters */}
          <section className="rounded-2xl border border-line bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-faint">Calibration parameters</h3>
              {session && (
                <Badge tone={session.preset === "custom" ? "warn" : "cyan"}>{session.preset}</Badge>
              )}
            </div>

            <fieldset disabled={!session || isDeploying} className="space-y-6 disabled:opacity-40">
              <div className="flex gap-2">
                {(["road", "sport", "track"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                      session?.preset === p ? "border-race bg-race/10 text-race" : "border-line text-ink-dim hover:border-line-strong"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="launchRpm" className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    Launch control RPM
                  </label>
                  <span className="tabular text-sm font-semibold text-ink">{session?.params.launchRpm ?? 3000}</span>
                </div>
                <input
                  id="launchRpm"
                  type="range"
                  min={3000}
                  max={5500}
                  step={50}
                  value={session?.params.launchRpm ?? 3000}
                  onChange={(e) => updateParam({ launchRpm: Number(e.target.value) })}
                  className="w-full accent-[#F04438]"
                />
                <p className="mt-1 text-[11px] text-ink-faint">RPM held at launch before clutch/throttle release.</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="burble" className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    Burble intensity
                  </label>
                  <span className="tabular text-sm font-semibold text-ink">{session?.params.burble ?? 0} / 5</span>
                </div>
                <input
                  id="burble"
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={session?.params.burble ?? 0}
                  onChange={(e) => updateParam({ burble: Number(e.target.value) })}
                  className="w-full accent-[#FF6A35]"
                />
                <p className="mt-1 text-[11px] text-ink-faint">Overrun fuel-cut pops on lift-off, simulated only.</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
                <div>
                  <div className="text-sm text-ink">Speed limiter bypass</div>
                  <p className="text-[11px] text-ink-faint">Track use only — demo toggle.</p>
                </div>
                <button
                  role="switch"
                  aria-checked={session?.params.limiterBypass ?? false}
                  onClick={() => updateParam({ limiterBypass: !(session?.params.limiterBypass ?? false) })}
                  className={`relative h-6 w-11 flex-none rounded-full transition ${
                    session?.params.limiterBypass ? "bg-race" : "bg-line-strong"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      session?.params.limiterBypass ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </fieldset>

            <div className="mt-6 border-t border-line pt-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!session || session.status !== "ready"}
                onClick={deploy}
              >
                {isDeploying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Deploying… {deployProgress}%
                  </>
                ) : isComplete ? (
                  <>
                    <CheckCircle2 size={16} /> Deployed
                  </>
                ) : (
                  <>
                    <Rocket size={16} /> Deploy to Demo Dyno Server
                  </>
                )}
              </Button>
              {isDeploying && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-gradient-to-r from-race to-race-2 transition-all" style={{ width: `${deployProgress}%` }} />
                </div>
              )}
              {isComplete && session?.deployedAt && (
                <div className="mt-3 rounded-lg border border-ok/30 bg-ok/8 px-3 py-2.5 text-xs text-ok">
                  Calibration deployed at {new Date(session.deployedAt).toLocaleTimeString()}. {job?.ref} checklist and Bay status updated.
                </div>
              )}
              <button onClick={reset} disabled={!session || isDeploying} className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink disabled:opacity-40">
                <RotateCcw size={12} /> Start over
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
