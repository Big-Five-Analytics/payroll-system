import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { applyForAdvance, getMyAdvanceApplications } from '../../services/salaryAdvanceService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';

export default function MyAdvances() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchApplications = () => {
    setLoading(true);
    getMyAdvanceApplications()
      .then(({ data }) => setApplications(data.data))
      .catch(() => toast.error('Failed to load salary advance applications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApplications(); }, []);

  const onSubmit = async (values) => {
    try {
      await applyForAdvance(values);
      toast.success('Salary advance application submitted');
      reset();
      setModalOpen(false);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Salary Advances</h1>
          <p className="text-sm text-gray-500">Request a salary advance and track approval status</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Request Advance</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : applications.length === 0 ? (
          <EmptyState title="No salary advance requests yet" description="Submit a request using the button above." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Deduction Status</th>
                <th className="py-2 pr-4 font-medium">Comment</th>
                <th className="py-2 pr-4 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-900">ZMW {Number(a.amountRequested).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-gray-600 max-w-xs truncate" title={a.reason}>{a.reason}</td>
                  <td className="py-3 pr-4"><Badge status={a.status} /></td>
                  <td className="py-3 pr-4 text-gray-500">
                    {a.status !== 'approved' ? '-' : a.recovered ? 'Deducted from a paycheck' : 'Pending next payroll run'}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{a.reviewComment || '-'}</td>
                  <td className="py-3 pr-4 text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request Salary Advance"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>Submit</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Amount Requested (ZMW)"
            type="number"
            step="0.01"
            error={errors.amountRequested?.message}
            {...register('amountRequested', { required: 'Required', min: { value: 0.01, message: 'Must be greater than 0' } })}
          />
          <Input label="Reason" error={errors.reason?.message} {...register('reason', { required: 'Required' })} />
        </div>
      </Modal>
    </div>
  );
}
