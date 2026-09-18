import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "race" | "cyan" | "ok" | "warn";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-elevated text-ink-dim border-line-strong",
  race: "bg-race/12 text-race border-race/35",
  cyan: "bg-cyan/12 text-cyan border-cyan/35",
  ok: "bg-ok/12 text-ok border-ok/35",
  warn: "bg-warn/12 text-warn border-warn/35",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${TONE[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function PulseDot({ tone = "race" }: { tone?: "race" | "ok" | "cyan" | "warn" }) {
  const color = { race: "bg-race", ok: "bg-ok", cyan: "bg-cyan", warn: "bg-warn" }[tone];
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}
