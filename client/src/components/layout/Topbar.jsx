import { LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-lg p-2 -ml-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold text-gray-800 md:hidden">Big Five</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 shrink-0 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="hidden text-right leading-tight sm:block">
            <p className="font-medium text-gray-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{user?.role?.name}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
