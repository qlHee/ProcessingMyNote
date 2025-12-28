/**
 * Zustand Store - Global state management
 */
import { create } from 'zustand';
import axios from 'axios';
import { authAPI, foldersAPI, tagsAPI, notesAPI } from '../api';

// Auth Store
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const res = await authAPI.login(username, password);
      const token = res.data.access_token;
      // 确保token正确保存
      if (token) {
        localStorage.setItem('token', token);
        console.log('Token saved:', token.substring(0, 20) + '...');
      } else {
        console.error('No token received from login');
        return { success: false, error: 'No token received' };
      }
      set({ token, isAuthenticated: true, loading: false });
      try {
        // 获取用户信息
        const userRes = await authAPI.getMe();
        set({ user: userRes.data });
      } catch (userError) {
        console.error('Failed to fetch user info:', userError);
      }
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  },

  register: async (username, password) => {
    set({ loading: true });
    try {
      await authAPI.register(username, password);
      set({ loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  },

  fetchUser: async () => {
    try {
      const res = await authAPI.getMe();
      set({ user: res.data });
    } catch (error) {
      // 不要在获取用户信息失败时登出，只记录错误
      console.error('Failed to fetch user:', error);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

// Folders Store
export const useFoldersStore = create((set) => ({
  folders: [],
  folderTree: [],
  selectedFolderId: null,
  loading: false,

  fetchFolders: async () => {
    set({ loading: true });
    try {
      const [foldersRes, treeRes] = await Promise.all([
        foldersAPI.getAll(),
        foldersAPI.getTree(),
      ]);
      set({ folders: foldersRes.data, folderTree: treeRes.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  createFolder: async (data) => {
    try {
      const res = await foldersAPI.create(data);
      set((state) => ({ folders: [...state.folders, res.data] }));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  },

  updateFolder: async (id, data) => {
    try {
      const res = await foldersAPI.update(id, data);
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? res.data : f)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  },

  deleteFolder: async (id) => {
    try {
      await foldersAPI.delete(id);
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  },

  setSelectedFolder: (id) => set({ selectedFolderId: id }),
}));

// Tags Store
export const useTagsStore = create((set) => ({
  tags: [],
  selectedTagIds: [],
  loading: false,

  fetchTags: async () => {
    set({ loading: true });
    try {
      const res = await tagsAPI.getAll();
      set({ tags: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  createTag: async (data) => {
    try {
      const res = await tagsAPI.create(data);
      set((state) => ({ tags: [...state.tags, res.data] }));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  },

  updateTag: async (id, data) => {
    try {
      const res = await tagsAPI.update(id, data);
      set((state) => ({
        tags: state.tags.map((t) => (t.id === id ? res.data : t)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  },

  deleteTag: async (id) => {
    try {
      await tagsAPI.delete(id);
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
        selectedTagIds: state.selectedTagIds.filter((tid) => tid !== id),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  },

  toggleTagSelection: (id) => {
    set((state) => ({
      selectedTagIds: state.selectedTagIds.includes(id)
        ? state.selectedTagIds.filter((tid) => tid !== id)
        : [...state.selectedTagIds, id],
    }));
  },

  clearTagSelection: () => set({ selectedTagIds: [] }),
}));

// Notes Store
export const useNotesStore = create((set, get) => ({
  notes: [],
  currentNote: null,
  loading: false,
  searchKeyword: '',

  fetchNotes: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await notesAPI.getAll(params);
      set({ notes: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  fetchNote: async (id) => {
    set({ loading: true });
    try {
      const res = await notesAPI.getOne(id);
      set({ currentNote: res.data, loading: false });
      return res.data;
    } catch (error) {
      set({ loading: false });
      return null;
    }
  },

  uploadNote: async (file, data = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data.title) formData.append('title', data.title);
    if (data.folder_id) formData.append('folder_id', data.folder_id);
    if (data.tag_ids?.length) formData.append('tag_ids', data.tag_ids.join(','));

    try {
      const res = await notesAPI.upload(formData);
      set((state) => ({ notes: [res.data, ...state.notes] }));
      return { success: true, data: res.data };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.response?.data?.detail || '上传失败' };
    }
  },

  updateNote: async (id, data) => {
    try {
      const res = await notesAPI.update(id, data);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? res.data : n)),
        currentNote: state.currentNote?.id === id ? res.data : state.currentNote,
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  },

  deleteNote: async (id) => {
    try {
      // 检查token是否存在
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: '未登录，请先登录' };
      }

      // 直接使用axios发送删除请求
      await axios.delete(`/api/notes/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
      }));
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.response?.data?.detail || '删除失败' };
    }
  },

  reprocessNote: async (id, params) => {
    try {
      const res = await notesAPI.reprocess(id, params);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? res.data : n)),
        currentNote: state.currentNote?.id === id ? res.data : state.currentNote,
      }));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  clearCurrentNote: () => set({ currentNote: null }),
}));
