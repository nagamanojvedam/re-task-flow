export function LoadingSpinner({ size = "medium", message = null }) {
  const sizeClass = size === "small" ? "spinner-sm" : size === "large" ? "spinner-lg" : "";

  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className={`spinner ${sizeClass}`} />
      {message && <p className="loading-text">{message}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default LoadingSpinner;

