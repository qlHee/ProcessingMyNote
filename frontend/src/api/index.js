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
  getAll: () => api.get('/folders/'),
  getTree: () => api.get('/folders/tree/'),
  create: (data) => api.post('/folders/', data),
  update: (id, data) => api.put(`/folders/${id}/`, data),
  delete: (id) => api.delete(`/folders/${id}/`),
};

// Tags API
export const tagsAPI = {
  getAll: () => api.get('/tags/'),
  create: (data) => api.post('/tags/', data),
  update: (id, data) => api.put(`/tags/${id}/`, data),
  delete: (id) => api.delete(`/tags/${id}/`),
};

// Notes API
export const notesAPI = {
  getAll: (params) => api.get('/notes/', { params }),
  getOne: (id) => api.get(`/notes/${id}/`),
  upload: (formData) => api.post('/notes/upload/', formData),
  update: (id, data) => api.put(`/notes/${id}/`, data),
  delete: (id) => api.delete(`/notes/${id}/`),
  reprocess: (id, params) => api.post(`/notes/${id}/reprocess/`, params),
  rotate: (id, angle) => {
    const formData = new FormData();
    formData.append('angle', angle);
    return api.post(`/notes/${id}/rotate/`, formData);
  },
  crop: (id, x, y, width, height) => {
    const formData = new FormData();
    formData.append('x', x);
    formData.append('y', y);
    formData.append('width', width);
    formData.append('height', height);
    return api.post(`/notes/${id}/crop/`, formData);
  },
  getImageUrl: (id, type) => `/api/notes/${id}/image/${type}`,
};

// Annotations API
export const annotationsAPI = {
  getAll: (noteId) => api.get(`/notes/${noteId}/annotations/`),
  create: (noteId, data) => api.post(`/notes/${noteId}/annotations/`, data),
  update: (noteId, annotationId, data) => 
    api.put(`/notes/${noteId}/annotations/${annotationId}/`, data),
  delete: (noteId, annotationId) => 
    api.delete(`/notes/${noteId}/annotations/${annotationId}/`),
};

// AI API
export const aiAPI = {
  adjust: (noteId, instruction) => 
    api.post('/ai/adjust/', { note_id: noteId, instruction }),
};

// Helper function to parse filename from Content-Disposition header
const parseFilename = (contentDisposition, defaultName) => {
  if (!contentDisposition) return defaultName;
  
  // Try to match filename*=UTF-8''encoded_filename (RFC 5987)
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\s]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch (e) {
      // Fall through to other methods
    }
  }
  
  // Try to match filename="quoted_filename"
  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1];
  }
  
  // Try to match filename=unquoted_filename
  const unquotedMatch = contentDisposition.match(/filename=([^;\s]+)/);
  if (unquotedMatch && unquotedMatch[1]) {
    return unquotedMatch[1];
  }
  
  return defaultName;
};

// Export API
export const exportAPI = {
  exportNote: async (noteId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录，请先登录');
    }
    const response = await fetch(`/api/export/note/${noteId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Export failed:', response.status, errorText);
      throw new Error(`导出失败: ${response.status}`);
    }
    
    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');
    const filename = parseFilename(contentDisposition, 'note.jpg');
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  exportFolder: async (folderId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/export/folder/${folderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('导出失败');
    }
    
    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');
    const filename = parseFilename(contentDisposition, 'folder.zip');
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

export default api;
