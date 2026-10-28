import { useState } from "react";
import { Link, Outlet } from "react-router";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/useAuth";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="layout-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="layout-main-wrapper">
        <header className="mobile-topbar">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <Link to="/dashboard" className="mobile-brand">
            <span className="brand-mark brand-mark-small">R</span>
            <span className="mobile-brand-title">Taskflow</span>
          </Link>

          <div className="mobile-user-avatar">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>
        </header>

        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
