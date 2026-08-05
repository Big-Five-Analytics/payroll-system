import { useEffect, useState, useCallback } from 'react';
import { Plus, Upload, Search, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { getGeneralWorkers, getSites, deleteGeneralWorker } from '../../services/generalWorkerService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import GeneralWorkerFormModal from './GeneralWorkerFormModal';
import UploadWorkersModal from './UploadWorkersModal';

const DAY_MS = 24 * 60 * 60 * 1000;

function ContractEndCell({ date }) {
  if (!date) return <span className="text-gray-400">-</span>;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((new Date(date) - today) / DAY_MS);

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Expired</span>
        <span className="text-xs text-gray-400">{date}</span>
      </span>
    );
  }
  if (diffDays <= 30) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          {diffDays}d left
        </span>
        <span className="text-xs text-gray-500">{date}</span>
      </span>
    );
  }
  return <span className="text-gray-600">{date}</span>;
}

const num = (value, decimals = 2) =>
  value === null || value === undefined || value === '' ? '-' : Number(value).toFixed(decimals);

const WAGE_BILL_COLUMNS = [
  { key: 'payRate', label: 'Hourly Rate', render: (w) => num(w.payRate) },
  { key: 'daysWorkedWeekday', label: 'Days Worked (Mon-Fri)', render: (w) => num(w.daysWorkedWeekday, 0) },
  { key: 'daysWorkedSaturday', label: 'Saturdays Worked', render: (w) => num(w.daysWorkedSaturday, 0) },
  { key: 'daysWorkedSundayPH', label: 'Sundays/PH Worked', render: (w) => num(w.daysWorkedSundayPH, 0) },
  { key: 'normalHoursWeekday', label: 'Normal Hours (Mon-Fri)', render: (w) => num(w.normalHoursWeekday) },
  { key: 'normalHoursSaturday', label: 'Normal Hours (Sat)', render: (w) => num(w.normalHoursSaturday) },
  { key: 'totalNormalHours', label: 'Total Normal Hours', render: (w) => num(w.totalNormalHours) },
  { key: 'basicPay', label: 'Basic Pay', render: (w) => num(w.basicPay) },
  { key: 'otHoursWeekday', label: 'OT Hours (Weekdays)', render: (w) => num(w.otHoursWeekday) },
  { key: 'otPayWeekday', label: 'OT Pay', render: (w) => num(w.otPayWeekday) },
  { key: 'otHoursSaturday', label: 'OT Hours (Sat)', render: (w) => num(w.otHoursSaturday) },
  { key: 'otPaySaturday', label: 'OT Pay (1.5x)', render: (w) => num(w.otPaySaturday) },
  { key: 'otHoursSundayPH', label: 'OT Hours (Sunday/PH)', render: (w) => num(w.otHoursSundayPH) },
  { key: 'otPaySundayPH', label: 'OT Pay (2.0x)', render: (w) => num(w.otPaySundayPH) },
  { key: 'monthlyNormalHoursTarget', label: 'Monthly Total Normal Hours', render: (w) => num(w.monthlyNormalHoursTarget) },
  { key: 'housingAllowance', label: 'Housing Allowance', render: (w) => num(w.housingAllowance) },
  { key: 'transportAllowance', label: 'Transport', render: (w) => num(w.transportAllowance) },
  { key: 'totalPay', label: 'Total Pay', render: (w) => num(w.totalPay) },
];

export default function GeneralWorkers() {
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [site, setSite] = useState('');
  const [status, setStatus] = useState('');
  const [expiring, setExpiring] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchSites = useCallback(() => {
    getSites().then(({ data }) => setSites(data.data)).catch(() => {});
  }, []);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getGeneralWorkers({
        page,
        limit: 15,
        search: search || undefined,
        site: site || undefined,
        status: status || undefined,
        expiringInDays: expiring || undefined,
      });
      setWorkers(data.data.generalWorkers);
      setPages(data.data.pages);
    } catch {
      toast.error('Failed to load general workers');
    } finally {
      setLoading(false);
    }
  }, [page, search, site, status, expiring]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);
  useEffect(() => { fetchSites(); }, [fetchSites]);

  const handleDelete = async (worker) => {
    if (!confirm(`Remove ${worker.fullName} from the general workers list? This cannot be undone.`)) return;
    try {
      await deleteGeneralWorker(worker.id);
      toast.success('Worker removed');
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove worker');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">General Workers</h1>
          <p className="text-sm text-gray-500">
            Casual/general staff tracked across sites - no system login. Monthly wage bill, contract expiry, and
            leave balance in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setUploadOpen(true)}>
            <Upload size={16} /> Upload Spreadsheet
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} /> Add Worker
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
          <Select className="w-48" value={site} onChange={(e) => { setPage(1); setSite(e.target.value); }}>
            <option value="">All sites</option>
            {sites.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select className="w-40" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Select className="w-56" value={expiring} onChange={(e) => { setPage(1); setExpiring(e.target.value); }}>
            <option value="">Any contract end date</option>
            <option value="30">Expiring within 30 days</option>
            <option value="60">Expiring within 60 days</option>
            <option value="90">Expiring within 90 days</option>
          </Select>
        </div>

        {loading ? (
          <Loader />
        ) : workers.length === 0 ? (
          <EmptyState title="No general workers found" description="Upload a spreadsheet or add a worker to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3 font-medium whitespace-nowrap sticky left-0 bg-white">Name</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">Trade / Role</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">Site</th>
                  {WAGE_BILL_COLUMNS.map((col) => (
                    <th key={col.key} className="py-2 pr-3 font-medium whitespace-nowrap">{col.label}</th>
                  ))}
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">Contract End</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">Leave Balance</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">Status</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-3 font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white">{w.fullName}</td>
                    <td className="py-3 pr-3 text-gray-600 whitespace-nowrap">{w.jobTitle || '-'}</td>
                    <td className="py-3 pr-3 text-gray-600 whitespace-nowrap">{w.site}</td>
                    {WAGE_BILL_COLUMNS.map((col) => (
                      <td key={col.key} className="py-3 pr-3 text-gray-600 whitespace-nowrap">{col.render(w)}</td>
                    ))}
                    <td className="py-3 pr-3 whitespace-nowrap"><ContractEndCell date={w.contractEndDate} /></td>
                    <td className={clsx('py-3 pr-3 whitespace-nowrap', Number(w.leaveBalance) <= 0 ? 'text-red-600' : 'text-gray-600')}>
                      {Number(w.leaveBalance)} days
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap"><Badge status={w.status} /></td>
                    <td className="py-3 pr-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditing(w); setFormOpen(true); }}
                          aria-label={`Edit ${w.fullName}`}
                          className="rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(w)}
                          aria-label={`Delete ${w.fullName}`}
                          className="rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Card>

      <GeneralWorkerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); fetchWorkers(); fetchSites(); }}
        worker={editing}
        sites={sites}
      />

      <UploadWorkersModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onImported={() => { fetchWorkers(); fetchSites(); }}
        sites={sites}
      />
    </div>
  );
}
