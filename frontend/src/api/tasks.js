import { api } from "../lib/api";

export async function getTasks(
  projectId,
  {
    page = 1,
    pageSize = 20,
    status = null,
    priority = null,
    assigneeId = null,
    sortBy = "created_at",
    sortOrder = "desc",
  } = {}
) {
  const params = {
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  if (status) params.status = status;
  if (priority) params.priority = priority;
  if (assigneeId) params.assignee_id = assigneeId;

  const response = await api.get(`/projects/${projectId}/tasks`, { params });
  return response.data;
}

export async function getTask(projectId, taskId) {
  const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
}

export async function createTask(
  projectId,
  {
    title,
    description = null,
    status = "todo",
    priority = "medium",
    assigneeId = null,
    dueDate = null,
  }
) {
  const payload = {
    title: title.trim(),
    description: description && description.trim() !== "" ? description.trim() : null,
    status,
    priority,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
  };

  const response = await api.post(`/projects/${projectId}/tasks`, payload);
  return response.data;
}

export async function updateTask(
  projectId,
  taskId,
  {
    title,
    description = null,
    status,
    priority,
    assigneeId = null,
    dueDate = null,
  }
) {
  const payload = {
    title: title.trim(),
    description: description && description.trim() !== "" ? description.trim() : null,
    status,
    priority,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
  };

  const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, payload);
  return response.data;
}

export async function deleteTask(projectId, taskId) {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
}

