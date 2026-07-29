import { useEffect, useState, useCallback } from 'react';
import { List, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllAttendance, getAttendanceSummary } from '../../services/attendanceService';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

export default function AttendanceOverview() {
  const [view, setView] = useState('summary'); // 'summary' | 'log'
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(() => {
    setLoading(true);
    getAttendanceSummary(month, year)
      .then(({ data }) => setSummary(data.data))
      .catch(() => toast.error('Failed to load attendance summary'))
      .finally(() => setLoading(false));
  }, [month, year]);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    getAllAttendance({ page, limit: 20 })
      .then(({ data }) => { setLogs(data.data.logs); setPages(data.data.pages); })
      .catch(() => toast.error('Failed to load attendance logs'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    if (view === 'summary') fetchSummary();
    else fetchLogs();
  }, [view, fetchSummary, fetchLogs]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">Review clock-ins, lateness, and overtime across the company</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'summary' ? 'primary' : 'secondary'} onClick={() => setView('summary')}>
            <BarChart3 size={16} /> Summary
          </Button>
          <Button variant={view === 'log' ? 'primary' : 'secondary'} onClick={() => setView('log')}>
            <List size={16} /> Raw Log
          </Button>
        </div>
      </div>

      {view === 'summary' && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <Select className="w-32" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select className="w-32" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>

          {loading ? (
            <Loader />
          ) : !summary || summary.employees.length === 0 ? (
            <EmptyState title="No attendance data for this period" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">Employee</th>
                  <th className="py-2 pr-4 font-medium">Department</th>
                  <th className="py-2 pr-4 font-medium">Days Logged</th>
                  <th className="py-2 pr-4 font-medium">Days Late</th>
                  <th className="py-2 pr-4 font-medium">Total Late (min)</th>
                  <th className="py-2 pr-4 font-medium">Total Overtime (min)</th>
                </tr>
              </thead>
              <tbody>
                {summary.employees.map((e) => (
                  <tr key={e.employeeId} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">{e.employeeName}</td>
                    <td className="py-3 pr-4 text-gray-600">{e.department}</td>
                    <td className="py-3 pr-4 text-gray-600">{e.daysLogged}</td>
                    <td className="py-3 pr-4 text-gray-600">{e.daysLate}</td>
                    <td className="py-3 pr-4 text-gray-600">{e.totalLateMinutes}</td>
                    <td className="py-3 pr-4 text-gray-600">{e.totalOvertimeMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {view === 'log' && (
        <Card className="p-4">
          {loading ? (
            <Loader />
          ) : logs.length === 0 ? (
            <EmptyState title="No attendance logs yet" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Employee</th>
                  <th className="py-2 pr-4 font-medium">Department</th>
                  <th className="py-2 pr-4 font-medium">Clock In</th>
                  <th className="py-2 pr-4 font-medium">Clock Out</th>
                  <th className="py-2 pr-4 font-medium">Late</th>
                  <th className="py-2 pr-4 font-medium">Overtime</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-900">{l.logDate}</td>
                    <td className="py-2 pr-4 text-gray-600">{l.employee.firstName} {l.employee.lastName}</td>
                    <td className="py-2 pr-4 text-gray-600">{l.employee.department?.name || '-'}</td>
                    <td className="py-2 pr-4 text-gray-600">{formatTime(l.clockInAt)}</td>
                    <td className="py-2 pr-4 text-gray-600">{formatTime(l.clockOutAt)}</td>
                    <td className="py-2 pr-4 text-gray-600">{l.lateMinutes > 0 ? `${l.lateMinutes} min` : '-'}</td>
                    <td className="py-2 pr-4 text-gray-600">{l.overtimeMinutes > 0 ? `${l.overtimeMinutes} min` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination page={page} pages={pages} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}
