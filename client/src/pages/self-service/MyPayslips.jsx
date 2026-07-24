import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyPayslips, downloadPayslip } from '../../services/payrollService';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPayslips()
      .then(({ data }) => setPayslips(data.data))
      .catch(() => toast.error('Failed to load payslips'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Payslips</h1>
        <p className="text-sm text-gray-500">
          Payslips become available for download once that pay period has been paid out
        </p>
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : payslips.length === 0 ? (
          <EmptyState
            title="No payslips available yet"
            description="Once payroll for a period is processed, approved, and paid, your payslip will appear here."
          />
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
    </div>
  );
}
