import { api } from "../lib/api";

export async function getComments(
  projectId,
  taskId,
  { page = 1, pageSize = 20 } = {}
) {
  const response = await api.get(
    `/projects/${projectId}/tasks/${taskId}/comments`,
    {
      params: {
        page,
        page_size: pageSize,
      },
    }
  );
  return response.data;
}

export async function createComment(projectId, taskId, { content }) {
  const payload = {
    content: content.trim(),
  };
  const response = await api.post(
    `/projects/${projectId}/tasks/${taskId}/comments`,
    payload
  );
  return response.data;
}

export async function deleteComment(projectId, taskId, commentId) {
  const response = await api.delete(
    `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
  );
  return response.data;
}

