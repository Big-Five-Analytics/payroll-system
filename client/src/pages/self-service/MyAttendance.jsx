import { useEffect, useState } from 'react';
import { LogIn, LogOut, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { clockIn, clockOut, getTodayStatus, getMyAttendance } from '../../services/attendanceService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

export default function MyAttendance() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([getTodayStatus(), getMyAttendance({})])
      .then(([todayRes, historyRes]) => {
        setToday(todayRes.data.data);
        setHistory(historyRes.data.data);
      })
      .catch(() => toast.error('Failed to load attendance data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleClockIn = async () => {
    setActing(true);
    try {
      const { data } = await clockIn();
      toast.success(data.message);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clock in');
    } finally {
      setActing(false);
    }
  };

  const handleClockOut = async () => {
    setActing(true);
    try {
      const { data } = await clockOut();
      toast.success(data.message);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clock out');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <Loader />;

  const canClockIn = !today;
  const canClockOut = today && !today.clockOutAt;
  const isDone = today && today.clockOutAt;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Attendance</h1>
        <p className="text-sm text-gray-500">
          Clock in and out from the office network - standard hours are 08:00 to 17:00
        </p>
      </div>

      <Card className="p-6 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
          <Clock size={26} />
        </div>

        {isDone ? (
          <div>
            <p className="font-medium text-gray-900">You're all done for today</p>
            <p className="text-sm text-gray-500 mt-1">
              Clocked in at {formatTime(today.clockInAt)} · Clocked out at {formatTime(today.clockOutAt)}
            </p>
            {today.overtimeMinutes > 0 && (
              <p className="text-sm text-amber-600 mt-1">{today.overtimeMinutes} minute(s) of overtime logged</p>
            )}
          </div>
        ) : canClockOut ? (
          <div>
            <p className="font-medium text-gray-900">Clocked in at {formatTime(today.clockInAt)}</p>
            {today.lateMinutes > 0 && (
              <p className="text-sm text-amber-600 mt-1">{today.lateMinutes} minute(s) after the 08:00 start time</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">You haven't clocked in yet today</p>
        )}

        <div className="flex gap-3">
          {canClockIn && (
            <Button onClick={handleClockIn} disabled={acting}>
              <LogIn size={16} /> Clock In
            </Button>
          )}
          {canClockOut && (
            <Button onClick={handleClockOut} disabled={acting} variant="secondary">
              <LogOut size={16} /> Clock Out
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          You must be connected to the office network to clock in or out.
        </p>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent History</h2>
        {history.length === 0 ? (
          <EmptyState title="No attendance records yet" description="Your clock-in history will appear here." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Clock In</th>
                <th className="py-2 pr-4 font-medium">Clock Out</th>
                <th className="py-2 pr-4 font-medium">Late</th>
                <th className="py-2 pr-4 font-medium">Overtime</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-900">{h.logDate}</td>
                  <td className="py-2 pr-4 text-gray-600">{formatTime(h.clockInAt)}</td>
                  <td className="py-2 pr-4 text-gray-600">{formatTime(h.clockOutAt)}</td>
                  <td className="py-2 pr-4 text-gray-600">{h.lateMinutes > 0 ? `${h.lateMinutes} min` : '-'}</td>
                  <td className="py-2 pr-4 text-gray-600">{h.overtimeMinutes > 0 ? `${h.overtimeMinutes} min` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
