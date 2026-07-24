import api from './api';

export const applyForLeave = (data) => api.post('/leave', data);
export const getMyLeaveApplications = () => api.get('/leave/my');
export const getLeaveApplications = (params) => api.get('/leave', { params });
export const reviewLeaveApplication = (id, status, reviewComment) =>
  api.patch(`/leave/${id}/review`, { status, reviewComment });
