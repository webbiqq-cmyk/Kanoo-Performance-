import { NavLink } from "react-router-dom";
import { Gauge, SlidersHorizontal, Cpu, Wrench } from "lucide-react";

const DESTINATIONS = [
  { to: "/", label: "Command", icon: Gauge, end: true },
  { to: "/studio", label: "Studio", icon: SlidersHorizontal },
  { to: "/calibration", label: "Calibration", icon: Cpu },
  { to: "/operations", label: "Workshop", icon: Wrench },
];

export function MobileTabBar() {
  return (
    <nav className="flex flex-none items-stretch border-t border-line bg-surface md:hidden">
      {DESTINATIONS.map((d) => (
        <NavLink
          key={d.to}
          to={d.to}
          end={d.end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide ${
              isActive ? "text-race" : "text-ink-faint"
            }`
          }
        >
          <d.icon size={18} />
          {d.label}
        </NavLink>
      ))}
    </nav>
  );
}
