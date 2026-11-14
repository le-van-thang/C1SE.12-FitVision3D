import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import { I18nProvider } from "./i18n";
import { Landing } from "./landing/Landing";
import { FashionStoreHome } from "./features/ecommerce/FashionStoreHome";
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

/** Tailor & Size chart studio only accessible to Approved Store Partners or Admin */
const RequireStore: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/dashboard" replace />;
  if (userRole !== 'store' && userRole !== 'tailor' && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/** Admin Portal strictly isolated to System Admin */
const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated || userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const App: React.FC = () => (
  <BrowserRouter>
    <I18nProvider>
      <AuthProvider>
        <OrderProvider>
          <Routes>
            <Route path="/" element={<FashionStoreHome />} />
            <Route path="/legacy-landing" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tailor" element={<RequireStore><TailorStudio /></RequireStore>} />
            <Route path="/size-charts" element={<RequireStore><SizeChartManager /></RequireStore>} />
            <Route path="/admin" element={<RequireAdmin><AdminPortal /></RequireAdmin>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </OrderProvider>
      </AuthProvider>
    </I18nProvider>
  </BrowserRouter>
);

export default App;
