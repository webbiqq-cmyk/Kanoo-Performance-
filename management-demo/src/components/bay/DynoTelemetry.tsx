import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface Sample {
  rpm: number;
  boost: number;
  intakeTemp: number;
  power: number;
}

function nextSample(prev: Sample): Sample {
  const rpm = clamp(prev.rpm + (Math.random() - 0.5) * 600, 2200, 7100);
  const boost = clamp(prev.boost + (Math.random() - 0.5) * 0.4, 0.4, 1.9);
  const intakeTemp = clamp(prev.intakeTemp + (Math.random() - 0.5) * 1.5, 28, 58);
  const power = clamp(prev.power + (Math.random() - 0.5) * 40, 180, 840);
  return { rpm: Math.round(rpm), boost: Math.round(boost * 10) / 10, intakeTemp: Math.round(intakeTemp), power: Math.round(power) };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function DynoTelemetry() {
  const [running, setRunning] = useState(true);
  const [sample, setSample] = useState<Sample>({ rpm: 5200, boost: 1.2, intakeTemp: 41, power: 620 });
  const [history, setHistory] = useState<number[]>(() => Array.from({ length: 24 }, () => 620));
  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!running) {
      window.clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setSample((prev) => {
        const next = nextSample(prev);
        setHistory((h) => [...h.slice(1), next.power]);
        return next;
      });
    }, 900);
    return () => window.clearInterval(intervalRef.current);
  }, [running]);

  const max = Math.max(...history, 1);
  const points = history.map((v, i) => `${(i / (history.length - 1)) * 100},${100 - (v / max) * 90}`).join(" ");

  return (
    <div className="rounded-lg border border-line bg-canvas/60 p-3" onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Simulated live data</span>
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1 rounded-md border border-line-strong px-2 py-0.5 text-[10px] text-ink-dim hover:text-ink"
        >
          {running ? <Pause size={10} /> : <Play size={10} />} {running ? "Pause" : "Resume"}
        </button>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-10 w-full">
        <polyline points={points} fill="none" stroke="#F04438" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 grid grid-cols-4 gap-2 text-center">
        <TelemetryStat label="RPM" value={sample.rpm.toLocaleString()} />
        <TelemetryStat label="Boost" value={`${sample.boost.toFixed(1)} bar`} />
        <TelemetryStat label="Intake" value={`${sample.intakeTemp}°C`} />
        <TelemetryStat label="Power" value={`${sample.power} hp`} />
      </div>
    </div>
  );
}

function TelemetryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="tabular text-xs font-semibold text-ink">{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
}
