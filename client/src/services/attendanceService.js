import api from './api';

export const clockIn = () => api.post('/attendance/clock-in');
export const clockOut = () => api.post('/attendance/clock-out');
export const getTodayStatus = () => api.get('/attendance/today');
export const getMyAttendance = (params) => api.get('/attendance/my', { params });
export const getAllAttendance = (params) => api.get('/attendance', { params });
export const getAttendanceSummary = (month, year) => api.get('/attendance/summary', { params: { month, year } });
