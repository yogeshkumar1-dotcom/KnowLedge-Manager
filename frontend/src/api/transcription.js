import api from './index.js';

export const transcriptionAPI = {
  getTranscripts: () => api.get('/transcripts'),
  uploadAudio: (formData) => api.post('/upload/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getTranscriptById: (id) => api.get(`/transcripts/${id}`),
  deleteTranscript: (id) => api.delete(`/transcripts/${id}`),
};