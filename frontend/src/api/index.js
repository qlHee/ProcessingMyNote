/**
 * API Service - Axios wrapper for backend communication
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/login', formData);
  },
  register: (username, password) => 
    api.post('/auth/register', { username, password }),
  getMe: () => api.get('/auth/me'),
};

// Folders API
export const foldersAPI = {
  getAll: () => api.get('/folders'),
  getTree: () => api.get('/folders/tree'),
  create: (data) => api.post('/folders', data),
  update: (id, data) => api.put(`/folders/${id}`, data),
  delete: (id) => api.delete(`/folders/${id}`),
};

// Tags API
export const tagsAPI = {
  getAll: () => api.get('/tags'),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
};

// Notes API
export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getOne: (id) => api.get(`/notes/${id}`),
  upload: (formData) => api.post('/notes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  reprocess: (id, params) => api.post(`/notes/${id}/reprocess`, params),
  getImageUrl: (id, type) => `/api/notes/${id}/image/${type}`,
};

// Annotations API
export const annotationsAPI = {
  getAll: (noteId) => api.get(`/notes/${noteId}/annotations`),
  create: (noteId, data) => api.post(`/notes/${noteId}/annotations`, data),
  update: (noteId, annotationId, data) => 
    api.put(`/notes/${noteId}/annotations/${annotationId}`, data),
  delete: (noteId, annotationId) => 
    api.delete(`/notes/${noteId}/annotations/${annotationId}`),
};

// AI API
export const aiAPI = {
  adjust: (noteId, instruction) => 
    api.post('/ai/adjust', { note_id: noteId, instruction }),
};

export default api;
