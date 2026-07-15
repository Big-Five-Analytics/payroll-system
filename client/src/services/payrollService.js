import api from './api';

export const generatePayroll = (month, year, employeeIds) =>
  api.post('/payroll/generate', { month, year, employeeIds });
export const getPayrolls = (params) => api.get('/payroll', { params });
export const getPayroll = (id) => api.get(`/payroll/${id}`);
export const approvePayroll = (id) => api.patch(`/payroll/${id}/approve`);
export const markPayrollPaid = (id) => api.patch(`/payroll/${id}/mark-paid`);

export const generatePayslip = (payrollId) => api.post(`/payslips/generate/${payrollId}`);
export const getPayslip = (id) => api.get(`/payslips/${id}`);
export const getEmployeePayslips = (employeeId) => api.get(`/payslips/employee/${employeeId}`);

// Payslip downloads require the JWT bearer token, so a plain <a href> won't work -
// fetch the PDF as a blob through the authenticated axios instance instead.
export const downloadPayslip = async (id, filename) => {
  const response = await api.get(`/payslips/${id}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
