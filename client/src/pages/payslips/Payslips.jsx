import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees } from '../../services/employeeService';
import { getEmployeePayslips, downloadPayslip } from '../../services/payrollService';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';

export default function Payslips() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value) => {
    setSearch(value);
    setSelected(null);
    if (value.length < 2) { setResults([]); return; }
    try {
      const { data } = await getEmployees({ search: value, limit: 5 });
      setResults(data.data.employees);
    } catch {
      toast.error('Search failed');
    }
  };

  const selectEmployee = async (emp) => {
    setSelected(emp);
    setResults([]);
    setSearch(`${emp.firstName} ${emp.lastName}`);
    setLoading(true);
    try {
      const { data } = await getEmployeePayslips(emp.id);
      setPayslips(data.data);
    } catch {
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Payslips</h1>
        <p className="text-sm text-gray-500">Search for an employee to view and download their payslips</p>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pl-9" placeholder="Search employee..." value={search} onChange={(e) => handleSearch(e.target.value)} />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
              {results.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => selectEmployee(emp)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {emp.firstName} {emp.lastName} <span className="text-gray-400">· {emp.employeeNumber}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {selected && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Payslips for {selected.firstName} {selected.lastName}
          </h2>
          {loading ? (
            <Loader />
          ) : payslips.length === 0 ? (
            <EmptyState title="No payslips yet" description="Payslips appear here once generated from an approved payroll run." />
          ) : (
            <div className="divide-y divide-gray-100">
              {payslips.map((ps) => (
                <div key={ps.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">{ps.payslipNumber}</p>
                    <p className="text-xs text-gray-500">
                      Period {ps.payroll.payPeriodMonth}/{ps.payroll.payPeriodYear} · Net Pay ZMW{' '}
                      {Number(ps.payroll.netPay).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadPayslip(ps.id, `${ps.payslipNumber}.pdf`).catch(() => toast.error('Download failed'))}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
