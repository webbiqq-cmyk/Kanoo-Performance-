import { NavLink } from "react-router-dom";
import { Gauge, SlidersHorizontal, Cpu, Wrench, ArrowLeft } from "lucide-react";

const DESTINATIONS = [
  { to: "/", label: "Command Centre", icon: Gauge, end: true },
  { to: "/studio", label: "Performance Studio", icon: SlidersHorizontal },
  { to: "/calibration", label: "Calibration Lab", icon: Cpu },
  { to: "/operations", label: "Workshop Operations", icon: Wrench },
];

export function NavRail() {
  return (
    <aside className="flex h-full w-[248px] flex-none flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-line-strong bg-canvas">
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M14 5L7 12L14 19" stroke="#F04438" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M18.5 5L11.5 12L18.5 19" stroke="#F4F4F5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </span>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-bold tracking-wide text-ink">KANOO PERFORMANCE</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">Tubli · Manama, Bahrain</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Performance Studio
        </div>
        <ul className="space-y-1">
          {DESTINATIONS.map((d) => (
            <li key={d.to}>
              <NavLink
                to={d.to}
                end={d.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-elevated text-ink border border-line-strong"
                      : "text-ink-dim border border-transparent hover:bg-elevated/60 hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <d.icon size={17} className={isActive ? "text-race" : "text-ink-faint group-hover:text-ink-dim"} />
                    {d.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line px-4 py-4">
        <a
          href="../../index.html"
          className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-xs font-semibold text-ink-dim transition hover:border-line-strong hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to kanooperformance.com
        </a>
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/35 bg-cyan/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
            Interactive demo
          </span>
        </div>
        <div className="mt-2 px-1 text-[10px] text-ink-faint">Demo by WebiQQ</div>
      </div>
    </aside>
  );
}
