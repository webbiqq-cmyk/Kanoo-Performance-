import { HashRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/shell/AppShell";
import { CommandCentre } from "./pages/CommandCentre";
import { PerformanceStudio } from "./pages/PerformanceStudio";
import { CalibrationLab } from "./pages/CalibrationLab";
import { WorkshopOperations } from "./pages/WorkshopOperations";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<CommandCentre />} />
          <Route path="/studio" element={<PerformanceStudio />} />
          <Route path="/calibration" element={<CalibrationLab />} />
          <Route path="/operations" element={<WorkshopOperations />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
