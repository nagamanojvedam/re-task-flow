/**
 * Helper to extract user-friendly error messages from backend responses.
 */
export function getApiErrorMessage(error, defaultMessage = "An unexpected error occurred.") {
  if (!error) return defaultMessage;

  if (error.code === "ERR_NETWORK") {
    return "Unable to connect to the server. Please verify the backend is running.";
  }

  const response = error.response;
  if (!response) {
    return error.message || defaultMessage;
  }

  const data = response.data;
  if (data?.detail) {
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          const loc = Array.isArray(item.loc) ? item.loc.filter((l) => l !== "body").join(" ") : "";
          return loc ? `${loc}: ${item.msg}` : item.msg;
        })
        .join("; ");
    }
    if (typeof data.detail === "object") {
      return JSON.stringify(data.detail);
    }
  }

  if (data?.message) {
    return data.message;
  }

  if (response.status === 401) {
    return "Session expired or invalid credentials. Please sign in again.";
  }
  if (response.status === 403) {
    return "You do not have permission to perform this action.";
  }
  if (response.status === 404) {
    return "The requested resource was not found.";
  }
  if (response.status === 409) {
    return "A conflict occurred with existing data.";
  }
  if (response.status === 422) {
    return "The request contains invalid data.";
  }

  return defaultMessage;
}

/**
 * Format ISO datetime string into human readable format.
 */
export function formatDateTime(isoString) {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Format ISO date string into readable date (YYYY-MM-DD to e.g. Oct 28, 2026).
 */
export function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString + "T00:00:00");
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Format relative time (e.g., "5m ago", "2h ago", "yesterday").
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Check if a task is overdue given today's date string (YYYY-MM-DD).
 */
export function isTaskOverdue(dueDate, status, todayStr) {
  if (!dueDate || status === "completed" || !todayStr) return false;
  return dueDate < todayStr;
}

/**
 * Validate UUID string.
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
}

/**
 * Shorten UUID for display (e.g. 550e8400...4400).
 */
export function shortenUUID(uuid) {
  if (!uuid || typeof uuid !== "string") return "—";
  const trimmed = uuid.trim();
  if (trimmed.length <= 13) return trimmed;
  return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
}
