export function EmptyState({
  icon = "📁",
  title = "No items found",
  description = "Get started by creating your first item.",
  actionText = null,
  onAction = null,
  actionButton = null,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {actionButton ? (
        actionButton
      ) : actionText && onAction ? (
        <button
          type="button"
          className="primary-button empty-state-btn"
          onClick={onAction}
        >
          {actionText}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyState;

