import { useEffect, useRef, useState } from "react";

/** Animates numeric text changes with a short, smooth transition, always landing on the exact value. */
export function useAnimatedNumber(target: number, durationMs = 420): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (target - from) * eased;
      setValue(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
        fromRef.current = target;
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

export function Metric({
  label,
  value,
  suffix = "",
  tone = "ink",
  size = "md",
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: "ink" | "race" | "cyan" | "ok";
  size?: "sm" | "md" | "lg";
}) {
  const animated = useAnimatedNumber(value);
  const toneClass = { ink: "text-ink", race: "text-race", cyan: "text-cyan", ok: "text-ok" }[tone];
  const sizeClass = { sm: "text-xl", md: "text-3xl", lg: "text-4xl" }[size];
  return (
    <div>
      <div className={`tabular font-display font-semibold ${sizeClass} ${toneClass}`}>
        {Math.round(animated).toLocaleString()}
        <span className="ml-1 text-base font-medium text-ink-faint">{suffix}</span>
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
    </div>
  );
}
