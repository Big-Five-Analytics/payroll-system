import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Employees from './pages/employees/Employees';
import Departments from './pages/employees/Departments';
import Payroll from './pages/payroll/Payroll';
import Payslips from './pages/payslips/Payslips';
import Reports from './pages/reports/Reports';
import Users from './pages/admin/Users';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/payslips" element={<Payslips />} />
              <Route path="/reports" element={<Reports />} />

              <Route element={<ProtectedRoute roles={['Administrator', 'HR Officer']} />}>
                <Route path="/employees" element={<Employees />} />
                <Route path="/departments" element={<Departments />} />
              </Route>

              <Route element={<ProtectedRoute roles={['Administrator', 'Finance Officer']} />}>
                <Route path="/payroll" element={<Payroll />} />
              </Route>

              <Route element={<ProtectedRoute roles={['Administrator']} />}>
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
