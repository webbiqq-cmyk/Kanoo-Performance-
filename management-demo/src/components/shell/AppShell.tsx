import { Outlet } from "react-router-dom";
import { NavRail } from "./NavRail";
import { MobileTabBar } from "./MobileTabBar";

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink">
      <div className="hidden md:flex">
        <NavRail />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
