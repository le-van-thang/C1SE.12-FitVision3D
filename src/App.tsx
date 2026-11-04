import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { I18nProvider } from "./i18n";
import { Landing } from "./landing/Landing";
import { Dashboard } from "./pages/Dashboard";
import { TailorStudio } from "./pages/TailorStudio";
import { SizeChartManager } from "./pages/SizeChartManager";
import { AdminPortal } from "./pages/AdminPortal";
import "./index.css";

/** Guests can only use the Dashboard; other studio pages need a signed-in account. */
const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => (
  <BrowserRouter>
    <I18nProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tailor" element={<RequireAuth><TailorStudio /></RequireAuth>} />
          <Route path="/size-charts" element={<RequireAuth><SizeChartManager /></RequireAuth>} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </I18nProvider>
  </BrowserRouter>
);

export default App;
