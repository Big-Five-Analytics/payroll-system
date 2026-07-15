import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMonthlySummary } from '../../services/reportService';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

export default function Reports() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const runReport = async () => {
    setLoading(true);
    try {
      const { data } = await getMonthlySummary(month, year);
      setSummary(data.data);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/reports/export/csv', {
        params: { month, year },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll-report-${year}-${month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Monthly payroll summaries and exports</p>
      </div>

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-32">
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32">
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Button onClick={runReport}><Search size={16} /> Run Report</Button>
        {summary && (
          <Button variant="secondary" onClick={handleExportCsv}>
            <Download size={16} /> Export CSV
          </Button>
        )}
      </Card>

      {loading && <Loader />}

      {summary && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ['Employees Paid', summary.employeeCount, ''],
              ['Gross Pay', summary.totals.grossPay, 'ZMW '],
              ['PAYE Tax', summary.totals.payeTax, 'ZMW '],
              ['NAPSA + NHIMA', summary.totals.napsaContribution + summary.totals.nhimaContribution, 'ZMW '],
              ['Net Pay', summary.totals.netPay, 'ZMW '],
            ].map(([label, value, prefix]) => (
              <Card key={label} className="p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {prefix}{Number(value).toLocaleString(undefined, { minimumFractionDigits: prefix ? 2 : 0 })}
                </p>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">By Department</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">Department</th>
                  <th className="py-2 pr-4 font-medium">Employees</th>
                  <th className="py-2 pr-4 font-medium">Gross Pay</th>
                  <th className="py-2 pr-4 font-medium">Net Pay</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byDepartment).map(([dept, d]) => (
                  <tr key={dept} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{dept}</td>
                    <td className="py-2 pr-4">{d.count}</td>
                    <td className="py-2 pr-4">ZMW {d.grossPay.toLocaleString()}</td>
                    <td className="py-2 pr-4">ZMW {d.netPay.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
