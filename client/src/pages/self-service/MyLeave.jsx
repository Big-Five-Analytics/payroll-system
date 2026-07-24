import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { applyForLeave, getMyLeaveApplications } from '../../services/leaveService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';

const LEAVE_TYPES = ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'compassionate', 'other'];

export default function MyLeave() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchApplications = () => {
    setLoading(true);
    getMyLeaveApplications()
      .then(({ data }) => setApplications(data.data))
      .catch(() => toast.error('Failed to load leave applications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApplications(); }, []);

  const onSubmit = async (values) => {
    try {
      await applyForLeave(values);
      toast.success('Leave application submitted');
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
          <h1 className="text-2xl font-semibold text-gray-900">My Leave</h1>
          <p className="text-sm text-gray-500">Apply for leave and track the status of your applications</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Apply for Leave</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : applications.length === 0 ? (
          <EmptyState title="No leave applications yet" description="Apply for leave using the button above." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Dates</th>
                <th className="py-2 pr-4 font-medium">Days</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 capitalize text-gray-900">{a.leaveType}</td>
                  <td className="py-3 pr-4 text-gray-600">{a.startDate} → {a.endDate}</td>
                  <td className="py-3 pr-4 text-gray-600">{a.numberOfDays}</td>
                  <td className="py-3 pr-4 text-gray-600 max-w-xs truncate" title={a.reason}>{a.reason}</td>
                  <td className="py-3 pr-4"><Badge status={a.status} /></td>
                  <td className="py-3 pr-4 text-gray-500">{a.reviewComment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Apply for Leave"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>Submit</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select label="Leave Type" error={errors.leaveType?.message} {...register('leaveType', { required: 'Required' })}>
            <option value="">Select type</option>
            {LEAVE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" error={errors.startDate?.message} {...register('startDate', { required: 'Required' })} />
            <Input label="End Date" type="date" error={errors.endDate?.message} {...register('endDate', { required: 'Required' })} />
          </div>
          <Input label="Reason" error={errors.reason?.message} {...register('reason', { required: 'Required' })} />
        </div>
      </Modal>
    </div>
  );
}
