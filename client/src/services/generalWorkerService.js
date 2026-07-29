import api from './api';

export const getGeneralWorkers = (params) => api.get('/general-workers', { params });
export const getSites = () => api.get('/general-workers/sites');
export const getExpiringContracts = (days) => api.get('/general-workers/expiring', { params: { days } });
export const getGeneralWorker = (id) => api.get(`/general-workers/${id}`);
export const createGeneralWorker = (data) => api.post('/general-workers', data);
export const updateGeneralWorker = (id, data) => api.put(`/general-workers/${id}`, data);
export const deleteGeneralWorker = (id) => api.delete(`/general-workers/${id}`);

export const previewWorkerUpload = (file, site) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('site', site);
  return api.post('/general-workers/upload/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const commitWorkerUpload = (payload) => api.post('/general-workers/upload/commit', payload);
