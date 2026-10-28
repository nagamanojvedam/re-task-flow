import { api } from "../lib/api";

export async function getProjectMembers(projectId) {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
}

export async function addProjectMember(projectId, { userId, role = "member" }) {
  const payload = {
    user_id: userId.trim(),
    role,
  };
  const response = await api.post(`/projects/${projectId}/members`, payload);
  return response.data;
}

export async function removeProjectMember(projectId, userId) {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
}

