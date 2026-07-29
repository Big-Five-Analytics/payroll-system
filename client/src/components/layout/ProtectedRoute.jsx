import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../ui/Loader';

export default function ProtectedRoute({ roles, requireEmployeeLink }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Checking session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role?.name)) return <Navigate to="/" replace />;
  // Self-service routes (leave, advances, payslips, attendance) aren't gated by role -
  // any account linked to an employee record can use them, including HR/Finance/Admin
  // staff who are also employees, not just the Employee role.
  if (requireEmployeeLink && !user.employeeId) return <Navigate to="/" replace />;

  return <Outlet />;
}
