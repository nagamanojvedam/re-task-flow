export function TaskFilters({
  filters,
  onChange,
  onReset,
  members = [],
  ownerId = null,
}) {
  function handleFilterChange(key, value) {
    onChange({
      ...filters,
      [key]: value === "" ? null : value,
      page: 1, // reset page on filter change
    });
  }

  const hasActiveFilters =
    Boolean(filters.status) ||
    Boolean(filters.priority) ||
    Boolean(filters.assigneeId) ||
    filters.sortBy !== "created_at" ||
    filters.sortOrder !== "desc";

  return (
    <div className="task-filters-card">
      <div className="task-filters-grid">
        <div className="filter-group">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            value={filters.status || ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-priority">Priority</label>
          <select
            id="filter-priority"
            value={filters.priority || ""}
            onChange={(e) => handleFilterChange("priority", e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-sort-by">Sort By</label>
          <select
            id="filter-sort-by"
            value={filters.sortBy || "created_at"}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          >
            <option value="created_at">Created Date</option>
            <option value="due_date">Due Date</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-sort-order">Order</label>
          <select
            id="filter-sort-order"
            value={filters.sortOrder || "desc"}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {members && members.length > 0 && (
          <div className="filter-group">
            <label htmlFor="filter-assignee">Assignee</label>
            <select
              id="filter-assignee"
              value={filters.assigneeId || ""}
              onChange={(e) => handleFilterChange("assigneeId", e.target.value)}
            >
              <option value="">All Assignees</option>
              {ownerId && <option value={ownerId}>Project Owner</option>}
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  Member ({m.user_id.slice(0, 8)}...)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="task-filters-reset-wrapper">
          <button
            type="button"
            className="secondary-button btn-sm reset-filters-btn"
            onClick={onReset}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskFilters;

