import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const documentService = {
  getAll: () => api.get('/documents/'),
  getOne: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents/', data),
  appendVersion: (id, versionData) => api.post(`/documents/${id}/versions/`, versionData),
};

export const aiService = {
  search: (query, topK = 5) => api.post('/search/', { query, top_k: topK }),
  chat: (query) => api.post('/chat/', { query }),
};

export default api;
