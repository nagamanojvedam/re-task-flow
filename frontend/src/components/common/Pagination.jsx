export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  disabled = false,
}) {
  if (totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav className="pagination" aria-label="Pagination">
      <div className="pagination-info">
        {totalItems > 0 ? (
          <span>
            Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of{" "}
            <strong>{totalItems}</strong>
          </span>
        ) : (
          <span>Page {currentPage} of {totalPages || 1}</span>
        )}
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="secondary-button pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          aria-label="Previous page"
        >
          ← Previous
        </button>

        <span className="pagination-page-indicator">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          className="secondary-button pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}

export default Pagination;

