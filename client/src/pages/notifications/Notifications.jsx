import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, HandCoins, FileText, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notificationService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const TYPE_ICONS = {
  leave_status: CalendarDays,
  salary_advance_status: HandCoins,
  payslip_ready: FileText,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getNotifications({ page, limit: 20 });
      setNotifications(data.data.notifications);
      setPages(data.data.pages);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      markAsRead(n.id).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">Updates on your payslips, leave, and salary advance requests</p>
        </div>
        {hasUnread && (
          <Button variant="secondary" onClick={handleMarkAllRead}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications yet" description="You'll see updates here about your payslips, leave, and salary advance requests." />
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={clsx(
                    'flex items-start gap-3 py-3 text-left hover:bg-gray-50 px-2 rounded-lg',
                    !n.isRead && 'bg-brand-50/60'
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{n.title}</span>
                      {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
                    </span>
                    <span className="block text-sm text-gray-600">{n.message}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Card>
    </div>
  );
}
