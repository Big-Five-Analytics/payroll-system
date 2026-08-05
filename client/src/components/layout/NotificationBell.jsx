import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, HandCoins, FileText, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../services/notificationService';

const TYPE_ICONS = {
  leave_status: CalendarDays,
  salary_advance_status: HandCoins,
  payslip_ready: FileText,
};

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(() => {
    getUnreadCount().then(({ data }) => setUnreadCount(data.data.count)).catch(() => {});
  }, []);

  // Refresh-on-load/navigation, no polling - refetches whenever the route changes.
  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount, location.pathname]);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const { data } = await getNotifications({ limit: 8 });
        setNotifications(data.data.notifications);
      } catch {
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNotificationClick = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
      markAsRead(n.id).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet</p>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={clsx(
                        'flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50',
                        !n.isRead && 'bg-brand-50/60'
                      )}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-gray-800">{n.title}</span>
                          {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
                        </span>
                        <span className="block text-xs text-gray-500 line-clamp-2">{n.message}</span>
                        <span className="block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="block w-full rounded-b-xl border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-gray-50"
            >
              View all
            </button>
          </div>
        </>
      )}
    </div>
  );
}
