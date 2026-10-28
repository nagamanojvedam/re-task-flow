import { Link } from "react-router";

export function PageHeader({
  title,
  description = null,
  breadcrumbs = [],
  actions = null,
}) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <ol className="breadcrumbs-list">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={idx} className="breadcrumbs-item">
                    {crumb.href && !isLast ? (
                      <Link to={crumb.href} className="breadcrumbs-link">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="breadcrumbs-current">{crumb.label}</span>
                    )}
                    {!isLast && <span className="breadcrumbs-separator">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>

      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

export default PageHeader;

