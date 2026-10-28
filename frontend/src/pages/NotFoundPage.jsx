import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <main className="not-found-layout">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-text">
          The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>
        <div className="not-found-actions">
          <Link to="/dashboard" className="primary-button btn-inline">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

