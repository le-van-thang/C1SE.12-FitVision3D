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
import { ShopPortal } from "./pages/ShopPortal";
import { ShopStorefrontPage } from "./pages/ShopStorefrontPage";
import { UserSettingsPage } from "./pages/UserSettingsPage";
import { GlobalToastHost } from "./components/common/GlobalToastHost";
import { MerchantOnboardingModal } from "./components/store/MerchantOnboardingModal";
import "./index.css";

/** Guests can only use the Dashboard; other studio pages need a signed-in account. */
const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

/** Tailor & Size chart studio only accessible to Approved Store Partners or Admin */
const RequireStore: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (userRole !== 'store' && userRole !== 'tailor' && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

/** Admin Portal handles its own dedicated Admin Login Gate without bouncing to shopping home */
const AdminRoute: React.FC = () => <AdminPortal />;

/** Strict Admin & Seller isolation: Admin -> /admin, Seller (SHOP_OWNER) -> /shop */
const HomeRoute: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  if (isAuthenticated && userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (isAuthenticated && userRole === 'store') {
    return <Navigate to="/shop" replace />;
  }
  return <FashionStoreHome />;
};

/** Customer / Guest Dashboard: strictly redirect Admin -> /admin and Seller -> /shop */
const DashboardRoute: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  if (isAuthenticated && userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (isAuthenticated && userRole === 'store') {
    return <Navigate to="/shop" replace />;
  }
  return <Dashboard />;
};

/** Fallback route aligned with authenticated role */
const RoleFallbackRoute: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  if (isAuthenticated && userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (isAuthenticated && userRole === 'store') {
    return <Navigate to="/shop" replace />;
  }
  return <Navigate to="/" replace />;
};

export const App: React.FC = () => (
  <BrowserRouter>
    <I18nProvider>
      <AuthProvider>
        <OrderProvider>
          <GlobalToastHost />
          <MerchantOnboardingModal />
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/stores/:slug" element={<ShopStorefrontPage />} />
            <Route path="/legacy-landing" element={<Landing />} />
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/settings" element={<RequireAuth><UserSettingsPage /></RequireAuth>} />
            <Route path="/shop" element={<RequireStore><ShopPortal /></RequireStore>} />
            <Route path="/tailor" element={<RequireStore><TailorStudio /></RequireStore>} />
            <Route path="/size-charts" element={<RequireStore><SizeChartManager /></RequireStore>} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="*" element={<RoleFallbackRoute />} />
          </Routes>
        </OrderProvider>
      </AuthProvider>
    </I18nProvider>
  </BrowserRouter>
);

export default App;
