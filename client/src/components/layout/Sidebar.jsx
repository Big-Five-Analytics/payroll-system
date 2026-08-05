import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Building2,
  CalendarDays,
  HandCoins,
  ClipboardCheck,
  KeyRound,
  UserX,
  Clock,
  Wifi,
  HardHat,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// requiresEmployeeLink links show for ANY account with a linked employee record,
// regardless of role - HR/Finance/Admin staff who are also employees see these too.
const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'HR Officer', 'Finance Officer', 'Employee'] },

  // Self-service
  { to: '/my-attendance', label: 'My Attendance', icon: Clock, requiresEmployeeLink: true },
  { to: '/my-leave', label: 'My Leave', icon: CalendarDays, requiresEmployeeLink: true },
  { to: '/my-advances', label: 'My Salary Advances', icon: HandCoins, requiresEmployeeLink: true },
  { to: '/my-payslips', label: 'My Payslips', icon: FileText, requiresEmployeeLink: true },

  // Staff functions
  { to: '/employees', label: 'Employees', icon: Users, roles: ['Administrator', 'HR Officer'] },
  { to: '/employees/terminated', label: 'Terminated Employees', icon: UserX, roles: ['Administrator', 'HR Officer'] },
  { to: '/general-workers', label: 'General Workers', icon: HardHat, roles: ['Administrator', 'HR Officer'] },
  { to: '/departments', label: 'Departments', icon: Building2, roles: ['Administrator', 'HR Officer'] },
  { to: '/attendance', label: 'Attendance', icon: Clock, roles: ['Administrator', 'HR Officer'] },
  { to: '/approvals/leave', label: 'Leave Approvals', icon: ClipboardCheck, roles: ['Administrator', 'HR Officer'] },
  { to: '/approvals/salary-advances', label: 'Advance Approvals', icon: ClipboardCheck, roles: ['Administrator', 'Finance Officer'] },
  { to: '/payroll', label: 'Payroll', icon: Wallet, roles: ['Administrator', 'Finance Officer'] },
  { to: '/payslips', label: 'Payslips', icon: FileText, roles: ['Administrator', 'Finance Officer', 'HR Officer'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['Administrator', 'Finance Officer', 'HR Officer'] },

  // Admin
  { to: '/admin/users', label: 'User Management', icon: ShieldCheck, roles: ['Administrator'] },
  { to: '/admin/office-networks', label: 'Office Networks', icon: Wifi, roles: ['Administrator'] },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: ['Administrator'] },

  // Everyone
  { to: '/settings/change-password', label: 'Change Password', icon: KeyRound, roles: ['Administrator', 'HR Officer', 'Finance Officer', 'Employee'] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const visibleLinks = links.filter((l) => {
    if (!user) return false;
    if (l.requiresEmployeeLink) return !!user.employeeId;
    return l.roles.includes(user.role?.name);
  });

  return (
    <>
      {/* Backdrop - mobile/tablet only, closes the drawer on outside click */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-brand-950 text-white',
          'transition-transform duration-200 ease-in-out',
          'md:static md:translate-x-0 md:min-h-screen',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-start justify-between px-4 pt-6 pb-8">
          <div>
            <p className="text-lg font-bold tracking-tight">Big Five</p>
            <p className="text-xs text-brand-300">Payroll Management System</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1 text-brand-200 hover:bg-brand-900 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6">
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
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
    </>
  );
}
