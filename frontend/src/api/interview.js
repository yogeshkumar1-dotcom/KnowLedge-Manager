import api from './index.js';

export const interviewAPI = {
  // Upload single interview file
  uploadSingleFile: (formData) => api.post('/audio/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Upload multiple interview files
  uploadMultipleFiles: (formData) => api.post('/audio/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Get all interviews
  getInterviews: () => api.get('/interviews'),
  
  // Get interview by ID
  getInterviewById: (id) => api.get(`/interviews/${id}`),
  
  // Update interview
  updateInterview: (id, data) => api.put(`/interviews/${id}`, data),
  
  // Delete interview
  deleteInterview: (id) => api.delete(`/interviews/${id}`)
};