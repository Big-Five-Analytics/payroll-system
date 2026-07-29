import api from './api';

export const getOfficeNetworks = () => api.get('/office-networks');
export const createOfficeNetwork = (data) => api.post('/office-networks', data);
export const updateOfficeNetwork = (id, data) => api.put(`/office-networks/${id}`, data);
export const deleteOfficeNetwork = (id) => api.delete(`/office-networks/${id}`);
