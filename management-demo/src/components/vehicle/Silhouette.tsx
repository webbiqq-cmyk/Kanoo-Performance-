import type { Silhouette } from "../../lib/types";

interface Props {
  kind: Silhouette;
  accent: string;
  className?: string;
}

/** Refined technical line-art silhouettes standing in for licensed vehicle photography. */
export function VehicleSilhouette({ kind, accent, className = "" }: Props) {
  const body =
    kind === "coupe-awd"
      ? "M40 178c0-8 10-14 24-14h30l18-30c8-13 26-24 46-24h96c22 0 42 10 54 26l22 28h26c14 0 24 8 24 18v10c0 8-6 14-14 14H54c-8 0-14-6-14-14Z"
      : kind === "coupe-rwd"
      ? "M36 176c0-8 9-13 21-13h26l20-28c9-13 27-22 46-22h84c19 0 37 9 47 24l20 26h30c13 0 22 7 22 16v9c0 8-6 13-13 13H49c-7 0-13-5-13-13Z"
      : "M25 176c0-6 7-11 17-11h20l12-18c9-12 26-21 43-21h122c16 0 30 8 38 21l11 17h22c10 0 18 5 18 10v7c0 6-5 10-11 10H36c-6 0-11-4-11-10Z";

  const canopy =
    kind === "coupe-awd"
      ? "M132 134l16-27c7-11 21-19 35-19h84c17 0 33 8 42 21l17 25"
      : kind === "coupe-rwd"
      ? "M122 137l19-27c8-11 22-19 37-19h72c16 0 31 8 40 21l18 25"
      : "M100 136l14-21c8-12 22-20 37-20h108c14 0 27 8 34 20l12 21";

  const wheelXs =
    kind === "coupe-awd" ? [150, 366] : kind === "coupe-rwd" ? [140, 356] : [118, 382];
  const wheelY = kind === "supercar-mid" ? 176 : 178;
  const wheelR = kind === "supercar-mid" ? 27 : 30;

  return (
    <svg viewBox="0 0 520 240" className={className} role="img" aria-label="Vehicle silhouette">
      <path d={body} fill="#1A1A1E" stroke={accent} strokeOpacity="0.55" strokeWidth="1.5" />
      <path d={canopy} fill="#0A0A0C" stroke="#38383F" strokeWidth="1.5" opacity="0.9" />
      {wheelXs.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={wheelY} r={wheelR} fill="#0A0A0C" stroke="#38383F" strokeWidth="6" />
          <circle cx={cx} cy={wheelY} r={wheelR * 0.42} fill="#202024" stroke={accent} strokeWidth="1.5" />
        </g>
      ))}
      <rect x={wheelXs[0] - 118} y={wheelY} width="16" height="5" rx="2.5" fill={accent} opacity="0.85" />
      <rect x={wheelXs[1] + 100} y={wheelY} width="16" height="5" rx="2.5" fill={accent} opacity="0.5" />
    </svg>
  );
}
