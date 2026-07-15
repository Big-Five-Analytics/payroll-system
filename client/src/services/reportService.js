import api from './api';

export const getMonthlySummary = (month, year) =>
  api.get('/reports/monthly-summary', { params: { month, year } });
export const getEmployeeHistory = (employeeId) => api.get(`/reports/employee/${employeeId}/history`);
export const exportCsvUrl = (month, year) =>
  `${import.meta.env.VITE_API_BASE_URL}/reports/export/csv?month=${month}&year=${year}`;
