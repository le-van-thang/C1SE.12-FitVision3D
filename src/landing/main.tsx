import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/i18n";
import { FashionStoreHome } from "@/features/ecommerce/FashionStoreHome";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <FashionStoreHome />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
);
