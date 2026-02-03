import api from './index.js';

export const grazittiAPI = {
  getUsers: () => api.get('/grazitti/users'),
  getUserInfo: (id) => api.get(`/grazitti/users/${id}`),
  updateUserInfo: (id, userData) => api.put(`/grazitti/users/${id}`, userData),
};