// ============================================================
// FITVISION 3D - ROOT ROUTER CONFIGURATION
// ============================================================
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { TailorStudio } from "./pages/TailorStudio";
import { SizeChartManager } from "./pages/SizeChartManager";
import "./index.css";

export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/tailor" element={<TailorStudio />} />
      <Route path="/size-charts" element={<SizeChartManager />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
