import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { TailorStudio } from "./pages/TailorStudio";
import { SizeChartManager } from "./pages/SizeChartManager";
import "./index.css";

export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tailor" element={<TailorStudio />} />
      <Route path="/size-charts" element={<SizeChartManager />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
