import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        {user?.mustChangePassword && (
          <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800">
            <span className="flex items-center gap-2">
              <ShieldAlert size={16} />
              You're using a default password. We recommend changing it.
            </span>
            <Link to="/settings/change-password" className="font-medium underline hover:text-amber-900">
              Change password
            </Link>
          </div>
        )}
        <main className="flex-1 p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
