import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'HR Officer', 'Finance Officer'] },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['Administrator', 'HR Officer'] },
  { to: '/departments', label: 'Departments', icon: Building2, roles: ['Administrator', 'HR Officer'] },
  { to: '/payroll', label: 'Payroll', icon: Wallet, roles: ['Administrator', 'Finance Officer'] },
  { to: '/payslips', label: 'Payslips', icon: FileText, roles: ['Administrator', 'Finance Officer', 'HR Officer'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['Administrator', 'Finance Officer', 'HR Officer'] },
  { to: '/admin/users', label: 'User Management', icon: ShieldCheck, roles: ['Administrator'] },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: ['Administrator'] },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-brand-950 text-white min-h-screen px-4 py-6">
      <div className="px-2 mb-8">
        <p className="text-lg font-bold tracking-tight">Big Five</p>
        <p className="text-xs text-brand-300">Payroll Management System</p>
      </div>
      <nav className="flex flex-col gap-1">
        {links
          .filter((l) => !user || l.roles.includes(user.role?.name))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-brand-200 hover:bg-brand-900 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
