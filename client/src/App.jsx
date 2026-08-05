import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Employees from './pages/employees/Employees';
import Departments from './pages/employees/Departments';
import TerminatedEmployees from './pages/employees/TerminatedEmployees';
import Payroll from './pages/payroll/Payroll';
import Payslips from './pages/payslips/Payslips';
import Reports from './pages/reports/Reports';
import Users from './pages/admin/Users';
import AuditLogs from './pages/admin/AuditLogs';
import ChangePassword from './pages/settings/ChangePassword';
import MyLeave from './pages/self-service/MyLeave';
import MyAdvances from './pages/self-service/MyAdvances';
import MyPayslips from './pages/self-service/MyPayslips';
import MyAttendance from './pages/self-service/MyAttendance';
import LeaveApprovals from './pages/approvals/LeaveApprovals';
import AdvanceApprovals from './pages/approvals/AdvanceApprovals';
import AttendanceOverview from './pages/attendance/AttendanceOverview';
import OfficeNetworks from './pages/admin/OfficeNetworks';
import GeneralWorkers from './pages/general-workers/GeneralWorkers';
import Notifications from './pages/notifications/Notifications';

const STAFF_ROLES = ['Administrator', 'HR Officer', 'Finance Officer'];

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
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings/change-password" element={<ChangePassword />} />

              {/* Self-service - any account linked to an employee record, not just the Employee role */}
              <Route element={<ProtectedRoute requireEmployeeLink />}>
                <Route path="/my-leave" element={<MyLeave />} />
                <Route path="/my-advances" element={<MyAdvances />} />
                <Route path="/my-payslips" element={<MyPayslips />} />
                <Route path="/my-attendance" element={<MyAttendance />} />
              </Route>

              {/* Staff-only */}
              <Route element={<ProtectedRoute roles={STAFF_ROLES} />}>
                <Route path="/payslips" element={<Payslips />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              <Route element={<ProtectedRoute roles={['Administrator', 'HR Officer']} />}>
                <Route path="/employees" element={<Employees />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/employees/terminated" element={<TerminatedEmployees />} />
                <Route path="/general-workers" element={<GeneralWorkers />} />
                <Route path="/approvals/leave" element={<LeaveApprovals />} />
                <Route path="/attendance" element={<AttendanceOverview />} />
              </Route>

              <Route element={<ProtectedRoute roles={['Administrator', 'Finance Officer']} />}>
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/approvals/salary-advances" element={<AdvanceApprovals />} />
              </Route>

              <Route element={<ProtectedRoute roles={['Administrator']} />}>
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
                <Route path="/admin/office-networks" element={<OfficeNetworks />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
