import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ScanLine, Scissors, Table2, Box } from "lucide-react";

interface NavbarProps {
  onDemoMode?: () => void;
  isDemoMode?: boolean;
}

const LINKS = [
  { path: "/dashboard",   label: "Dashboard Studio", Icon: ScanLine },
  { path: "/tailor",      label: "Tailor Studio",    Icon: Scissors },
  { path: "/size-charts", label: "Size Charts",      Icon: Table2 },
];

export const Navbar: React.FC<NavbarProps> = ({ onDemoMode, isDemoMode = false }) => {
  const { pathname } = useLocation();
  return (
    <header className="zf-nav no-print" id="app-navbar">
      {/* Plain anchor: full navigation back to the landing page */}
      <a href="/" className="zf-brand" id="brand-link">
        <span className="zf-brand-mark"><Box size={16} strokeWidth={1.5} /></span>
        <span>FitVision <b>3D</b></span>
      </a>

      <nav className="zf-links" aria-label="Main navigation">
        {LINKS.map(({ path, label, Icon }) => (
          <Link key={path} to={path} className={`zf-link ${pathname === path ? "active" : ""}`} id={`nav-${path.slice(1)}`}>
            <Icon size={16} strokeWidth={1.5} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div style={{ minWidth: 120, display: "flex", justifyContent: "flex-end" }}>
        {onDemoMode && (
          <button id="btn-demo-mode" className="zf-btn zf-btn--secondary" style={{ height: 34 }} onClick={onDemoMode}>
            {isDemoMode ? "Demo loaded" : "Load demo"}
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
