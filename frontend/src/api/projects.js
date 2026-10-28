import { api } from "../lib/api";

export async function getProjects({ page = 1, pageSize = 20 } = {}) {
  const response = await api.get("/projects", {
    params: {
      page,
      page_size: pageSize,
    },
  });
  return response.data;
}

export async function getProject(projectId) {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
}

export async function createProject({ name, description = null }) {
  const payload = {
    name: name.trim(),
    ...(description !== null && description !== undefined && description !== ""
      ? { description: description.trim() }
      : { description: null }),
  };
  const response = await api.post("/projects", payload);
  return response.data;
}

export async function updateProject(projectId, { name, description = null }) {
  const payload = {
    name: name.trim(),
    ...(description !== null && description !== undefined && description !== ""
      ? { description: description.trim() }
      : { description: null }),
  };
  const response = await api.put(`/projects/${projectId}`, payload);
  return response.data;
}

export async function deleteProject(projectId) {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
}

