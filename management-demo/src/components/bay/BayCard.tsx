import type { ReactNode } from "react";
import { Gauge, Hammer, Cpu, Sparkles, Clock } from "lucide-react";
import type { Bay, Job, Vehicle } from "../../lib/types";
import { Badge, PulseDot } from "../ui/Badge";

const KIND_ICON = { dyno: Gauge, fabrication: Hammer, calibration: Cpu, detailing: Sparkles };

function hoursAgo(at: number): string {
  const diff = Date.now() - at;
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m in stage`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${min % 60}m in stage`;
  return `${Math.floor(hr / 24)}d in stage`;
}

export function bayTone(bay: Bay): "race" | "warn" | "cyan" | "ok" | "neutral" {
  if (bay.blockedReason) return "warn";
  if (!bay.jobId) return "neutral";
  if (bay.kind === "dyno") return "race";
  if (bay.statusLabel.toLowerCase().includes("complete") || bay.statusLabel.toLowerCase().includes("ready")) return "ok";
  return "cyan";
}

export function BayCard({
  bay,
  job,
  vehicle,
  onClick,
  compact = false,
  telemetry,
}: {
  bay: Bay;
  job?: Job;
  vehicle?: Vehicle;
  onClick: () => void;
  compact?: boolean;
  telemetry?: ReactNode;
}) {
  const Icon = KIND_ICON[bay.kind];
  const tone = bayTone(bay);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`group w-full cursor-pointer rounded-xl border border-line bg-surface-2 p-4 text-left transition hover:border-line-strong hover:bg-elevated ${
        compact ? "" : "min-h-[168px]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line-strong bg-canvas text-ink-dim">
            <Icon size={15} />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Bay {String(bay.number).padStart(2, "0")}</div>
            <div className="font-display text-sm font-semibold text-ink">{bay.name}</div>
          </div>
        </div>
        {tone === "race" ? <PulseDot tone="race" /> : <Badge tone={tone}>{bay.statusLabel}</Badge>}
      </div>

      {tone === "race" && (
        <div className="mt-2">
          <Badge tone="race">{bay.statusLabel}</Badge>
        </div>
      )}

      <div className="mt-3">
        {vehicle && job ? (
          <>
            <div className="text-sm font-medium text-ink">
              {vehicle.make} {vehicle.model}
            </div>
            <div className="mt-0.5 text-xs text-ink-faint">
              {job.ref} · {job.status.replace("_", " ")}
            </div>
            {bay.blockedReason && (
              <div className="mt-2 rounded-md border border-warn/30 bg-warn/10 px-2.5 py-1.5 text-[11px] text-warn">
                {bay.blockedReason}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-ink-faint">Bay available</div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-faint">
        <Clock size={11} />
        {hoursAgo(bay.enteredStageAt)}
      </div>

      {telemetry && <div className="mt-3">{telemetry}</div>}
    </div>
  );
}
