import { useState } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../../context/useAuth";
import { shortenUUID } from "../../utils/formatters";

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  function handleCopyUserId() {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand-wrapper">
          <NavLink to="/dashboard" className="sidebar-brand" onClick={onClose}>
            <span className="brand-mark brand-mark-small">R</span>
            <div className="sidebar-brand-text">
              <span className="brand-title">re-taskflow</span>
              <span className="brand-subtitle">Project & Task Manager</span>
            </div>
          </NavLink>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          <div className="sidebar-section-title">MENU</div>
          <ul className="sidebar-links">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                }
                onClick={onClose}
              >
                <span className="sidebar-icon">📊</span>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                }
                onClick={onClose}
              >
                <span className="sidebar-icon">📁</span>
                <span>Projects</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                }
                onClick={onClose}
              >
                <span className="sidebar-icon">✓</span>
                <span>Tasks</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name" title={user?.full_name}>
                {user?.full_name || "User"}
              </span>
              <span className="sidebar-user-email" title={user?.email}>
                {user?.email || ""}
              </span>
            </div>
          </div>

          {user?.id && (
            <div className="sidebar-uuid-box">
              <div className="sidebar-uuid-label">Your User ID</div>
              <div className="sidebar-uuid-row">
                <code className="sidebar-uuid-code" title={user.id}>
                  {shortenUUID(user.id)}
                </code>
                <button
                  type="button"
                  className="sidebar-copy-btn"
                  onClick={handleCopyUserId}
                  title="Copy full UUID (needed when team members add you to projects)"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="secondary-button sidebar-logout-btn"
            onClick={logout}
          >
            <span className="sidebar-icon">🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
