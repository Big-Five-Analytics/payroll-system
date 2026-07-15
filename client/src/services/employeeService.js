import api from './api';

export const getEmployees = (params) => api.get('/employees', { params });
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
export const setEmployeeAllowance = (id, allowanceId, amount) =>
  api.post(`/employees/${id}/allowances`, { allowanceId, amount });
export const setEmployeeDeduction = (id, deductionId, amount) =>
  api.post(`/employees/${id}/deductions`, { deductionId, amount });

export const getDepartments = () => api.get('/departments');
export const createDepartment = (data) => api.post('/departments', data);
