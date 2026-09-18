import { useId } from "react";
import type { CurvePoint } from "../../lib/calculations";

interface Props {
  stock: CurvePoint[];
  selected: CurvePoint[];
  unit: "hp" | "Nm";
  accent: string;
  redlineRpm: number;
}

const W = 640;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 32, left: 46 };

export function PowerCurveChart({ stock, selected, unit, accent, redlineRpm }: Props) {
  const uid = useId();
  const maxVal = Math.max(...stock.map((p) => p.value), ...selected.map((p) => p.value)) * 1.12;
  const minRpm = Math.min(...stock.map((p) => p.rpm));
  const maxRpm = redlineRpm;

  const x = (rpm: number) => PAD.left + ((rpm - minRpm) / (maxRpm - minRpm)) * (W - PAD.left - PAD.right);
  const y = (val: number) => H - PAD.bottom - (val / maxVal) * (H - PAD.top - PAD.bottom);

  const toPath = (pts: CurvePoint[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.rpm).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");

  const gridRpms = [2000, 3000, 4000, 5000, 6000, 7000, 8000].filter((r) => r <= maxRpm + 200);
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round((maxVal * f) / 50) * 50);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Stock vs selected ${unit} curve`}>
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridVals.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#29292F" strokeWidth="1" />
            <text x={PAD.left - 10} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#6b6b74" className="tabular">
              {v}
            </text>
          </g>
        ))}
        {gridRpms.map((r) => (
          <text key={r} x={x(r)} y={H - PAD.bottom + 16} textAnchor="middle" fontSize="10" fill="#6b6b74" className="tabular">
            {r / 1000}k
          </text>
        ))}

        <path d={`${toPath(selected)} L ${x(selected[selected.length - 1].rpm)} ${y(0)} L ${x(selected[0].rpm)} ${y(0)} Z`} fill={`url(#fill-${uid})`} />

        <path d={toPath(stock)} fill="none" stroke="#6b6b74" strokeWidth="2" strokeDasharray="4 4" />
        <path d={toPath(selected)} fill="none" stroke={accent} strokeWidth="2.5" />

        {selected.map((p) => (
          <circle key={p.rpm} cx={x(p.rpm)} cy={y(p.value)} r="2.4" fill={accent} />
        ))}

        <line x1={x(redlineRpm)} x2={x(redlineRpm)} y1={PAD.top} y2={H - PAD.bottom} stroke="#F04438" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
        <text x={x(redlineRpm)} y={PAD.top - 4} textAnchor="middle" fontSize="9" fill="#F04438" opacity="0.8">
          redline
        </text>
      </svg>
      <div className="mt-2 flex items-center gap-5 text-xs text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: "#6b6b74" }} /> Stock ({unit})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: accent }} /> Selected package ({unit})
        </span>
        <span className="ml-auto italic">Illustrative estimate · RPM on horizontal axis</span>
      </div>
    </div>
  );
}
