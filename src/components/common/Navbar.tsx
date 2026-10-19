import React from "react";
import { Link, useLocation } from "react-router-dom";

interface NavbarProps {
  onDemoMode?: () => void;
  isDemoMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onDemoMode, isDemoMode = false }) => {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "01. Dashboard Studio", icon: "📐" },
    { path: "/tailor", label: "02. Tailor Studio B2B", icon: "✂️" },
    { path: "/size-charts", label: "03. Size Chart Manager", icon: "📊" },
  ];

  return (
    <header className="fv3d-navbar" id="fv3d-navbar">
      <div className="fv3d-navbar-left">
        <Link to="/" className="fv3d-brand" id="brand-link">
          <span className="fv3d-brand-glyph">▲</span>
          <span className="fv3d-brand-text">FitVision <span className="text-cyan">3D</span></span>
        </Link>
        <div className="fv3d-nav-badge" title="Zero-Image Retention: Local RAM WebAssembly Processing">
          <span className="live-dot" />
          <span>ZERO-IMAGE RETENTION · SLA &lt; 3.0s</span>
        </div>
      </div>

      <nav className="fv3d-nav-links" aria-label="Main Navigation">
        {navLinks.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`fv3d-nav-link ${isActive ? "active" : ""}`}
              id={`nav-link-${item.path.replace("/", "") || "dashboard"}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
              {isActive && <span className="nav-indicator" />}
            </Link>
          );
        })}
      </nav>

      <div className="fv3d-nav-actions">
        {onDemoMode && (
          <button
            id="btn-demo-mode"
            className={`btn btn-sm ${isDemoMode ? "btn-cyan-glow" : "btn-ghost"}`}
            onClick={onDemoMode}
            title="Load ISO-certified biometric simulation measurements"
          >
            <span>🎮</span>
            <span>{isDemoMode ? "Demo Active" : "Demo Mode"}</span>
          </button>
        )}
        <div className="fv3d-iso-tag font-mono">ISO 8559-1 Certified</div>
      </div>
    </header>
  );
};

export default Navbar;
