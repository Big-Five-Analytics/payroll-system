import { useEffect, useState } from 'react';
import { Users, Building2, Wallet, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getDashboardStats } from '../../services/dashboardService';
import { getUsers } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import toast from 'react-hot-toast';

const COLORS = ['#3478f6', '#599eff', '#8ec1ff', '#1e368a', '#215aeb', '#172253'];

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <Card className="p-5 flex items-center gap-4">
    <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${accent}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  </Card>
);

export default function Dashboard() {
  const { hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  // GET /api/users is Admin-only - only fetch here for Administrators, since this
  // Dashboard is also the landing page for every other role.
  useEffect(() => {
    if (!hasRole('Administrator')) return;
    getUsers()
      .then(({ data }) => console.log(data.data))
      .catch((error) => console.error('Error fetching users:', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;
  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Overview for {stats.currentPayPeriod.month}/{stats.currentPayPeriod.year}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Employees" value={stats.employeeCount} accent="bg-brand-600" />
        <StatCard icon={Users} label="Active Employees" value={stats.activeEmployeeCount} accent="bg-green-600" />
        <StatCard icon={Building2} label="Departments" value={stats.departmentCount} accent="bg-amber-500" />
        <StatCard
          icon={Wallet}
          label="Payroll Runs This Month"
          value={stats.currentMonthPayrollProcessed}
          accent="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} /> Current Month Payroll Totals
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Gross Pay</p>
              <p className="text-lg font-semibold text-gray-900">
                ZMW {stats.currentMonthTotals.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Deductions</p>
              <p className="text-lg font-semibold text-gray-900">
                ZMW {stats.currentMonthTotals.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Net Pay</p>
              <p className="text-lg font-semibold text-brand-700">
                ZMW {stats.currentMonthTotals.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Employees by Department</h2>
          {stats.employeesByDepartment.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.employeesByDepartment}
                  dataKey="count"
                  nameKey="department"
                  outerRadius={80}
                  label
                >
                  {stats.employeesByDepartment.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
