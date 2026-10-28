export function ErrorMessage({
  title = "Something went wrong",
  message,
  onRetry = null,
  onDismiss = null,
}) {
  if (!message) return null;

  return (
    <div className="error-alert" role="alert">
      <div className="error-alert-icon">⚠</div>
      <div className="error-alert-content">
        {title && <strong className="error-alert-title">{title}</strong>}
        <p className="error-alert-message">{message}</p>
        {onRetry && (
          <button
            type="button"
            className="secondary-button btn-sm error-retry-btn"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="error-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;

