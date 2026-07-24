import api from './api';

export const getUsers = (params) => api.get('/users', { params });
export const getRoles = () => api.get('/users/roles');
export const createUser = (data) => api.post('/users', data);
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate`);
export const reactivateUser = (id) => api.patch(`/users/${id}/reactivate`);
export const getEmployeesWithoutAccount = () => api.get('/employees/without-account');
export const getAuditLogs = (params) => api.get('/audit-logs', { params });
