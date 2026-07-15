import { useEffect, useState, useCallback } from 'react';
import { Play, CheckCircle2, Banknote, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPayrolls,
  generatePayroll,
  approvePayroll,
  markPayrollPaid,
  generatePayslip,
} from '../../services/payrollService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

export default function Payroll() {
  const { hasRole } = useAuth();
  const canProcess = hasRole('Administrator', 'Finance Officer');

  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ month: '', year: '', status: '' });
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genForm, setGenForm] = useState({ month: new Date().getMonth() + 1, year: currentYear });
  const [generating, setGenerating] = useState(false);

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await getPayrolls(params);
      setPayrolls(data.data.payrolls);
      setPages(data.data.pages);
    } catch {
      toast.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await generatePayroll(Number(genForm.month), Number(genForm.year));
      toast.success(`Payroll processed for ${data.data.count} employee(s)`);
      setGenModalOpen(false);
      fetchPayrolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approvePayroll(id);
      toast.success('Payroll approved');
      fetchPayrolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markPayrollPaid(id);
      toast.success('Marked as paid');
      fetchPayrolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleGeneratePayslip = async (id) => {
    try {
      await generatePayslip(id);
      toast.success('Payslip generated - find it under Payslips');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payslip');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500">Process, approve, and pay out payroll runs</p>
        </div>
        {canProcess && (
          <Button onClick={() => setGenModalOpen(true)}>
            <Play size={16} /> Generate Payroll
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <Select
            className="w-32"
            value={filters.month}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, month: e.target.value })); }}
          >
            <option value="">All months</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Select
            className="w-32"
            value={filters.year}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, year: e.target.value })); }}
          >
            <option value="">All years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select
            className="w-36"
            value={filters.status}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, status: e.target.value })); }}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="processed">Processed</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </Select>
        </div>

        {loading ? (
          <Loader />
        ) : payrolls.length === 0 ? (
          <EmptyState title="No payroll records" description="Generate a payroll run to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">Employee</th>
                  <th className="py-2 pr-4 font-medium">Period</th>
                  <th className="py-2 pr-4 font-medium">Gross Pay</th>
                  <th className="py-2 pr-4 font-medium">Deductions</th>
                  <th className="py-2 pr-4 font-medium">Net Pay</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  {canProcess && <th className="py-2 pr-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {p.employee.firstName} {p.employee.lastName}
                      <div className="text-xs text-gray-400">{p.employee.department?.name}</div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{p.payPeriodMonth}/{p.payPeriodYear}</td>
                    <td className="py-3 pr-4 text-gray-600">ZMW {Number(p.grossPay).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-gray-600">ZMW {Number(p.totalDeductions).toLocaleString()}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900">ZMW {Number(p.netPay).toLocaleString()}</td>
                    <td className="py-3 pr-4"><Badge status={p.status} /></td>
                    {canProcess && (
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-2">
                          {p.status === 'processed' && (
                            <button onClick={() => handleApprove(p.id)} title="Approve" className="text-gray-400 hover:text-amber-600">
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          {p.status === 'approved' && (
                            <button onClick={() => handleMarkPaid(p.id)} title="Mark Paid" className="text-gray-400 hover:text-green-600">
                              <Banknote size={16} />
                            </button>
                          )}
                          {p.status !== 'draft' && (
                            <button onClick={() => handleGeneratePayslip(p.id)} title="Generate Payslip" className="text-gray-400 hover:text-brand-600">
                              <FileText size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Card>

      <Modal
        open={genModalOpen}
        onClose={() => setGenModalOpen(false)}
        title="Generate Payroll"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenModalOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? 'Processing...' : 'Run Payroll'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          This will calculate PAYE, NAPSA, and NHIMA for every active employee who has not
          yet been processed for the selected period.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Month" value={genForm.month} onChange={(e) => setGenForm((f) => ({ ...f, month: e.target.value }))}>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Select label="Year" value={genForm.year} onChange={(e) => setGenForm((f) => ({ ...f, year: e.target.value }))}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
      </Modal>
    </div>
  );
}
