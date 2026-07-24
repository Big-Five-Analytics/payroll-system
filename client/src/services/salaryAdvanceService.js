import api from './api';

export const applyForAdvance = (data) => api.post('/salary-advances', data);
export const getMyAdvanceApplications = () => api.get('/salary-advances/my');
export const getAdvanceApplications = (params) => api.get('/salary-advances', { params });
export const reviewAdvanceApplication = (id, status, reviewComment) =>
  api.patch(`/salary-advances/${id}/review`, { status, reviewComment });
