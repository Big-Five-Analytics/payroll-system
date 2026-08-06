import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { applyForAdvance, getMyAdvanceApplications } from '../../services/salaryAdvanceService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';

const REPAYMENT_PLANS = [
  { value: 'full', label: 'Full deduction (next payroll)' },
  { value: 'two_months', label: 'Over 2 months' },
  { value: 'three_months', label: 'Over 3 months' },
];

const repaymentPlanLabel = (value) => REPAYMENT_PLANS.find((p) => p.value === value)?.label || '-';

const today = new Date().toISOString().slice(0, 10);

export default function MyAdvances() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [pendingValues, setPendingValues] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchApplications = () => {
    setLoading(true);
    getMyAdvanceApplications()
      .then(({ data }) => setApplications(data.data))
      .catch(() => toast.error('Failed to load salary advance applications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApplications(); }, []);

  const openModal = () => {
    setStep('form');
    setPendingValues(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setStep('form');
    reset();
  };

  // Step 1 - collect and validate the form, then move to the confirmation step
  // rather than submitting immediately.
  const handleContinue = handleSubmit((values) => {
    setPendingValues(values);
    setStep('confirm');
  });

  // Step 2, Deny - go back to the form with whatever the employee already entered.
  const handleDeny = () => setStep('form');

  // Step 2, Accept - only now does the application actually get sent.
  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await applyForAdvance(pendingValues);
      toast.success('Salary advance application submitted');
      closeModal();
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Salary Advances</h1>
          <p className="text-sm text-gray-500">Request a salary advance and track approval status</p>
        </div>
        <Button onClick={openModal}><Plus size={16} /> Request Advance</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : applications.length === 0 ? (
          <EmptyState title="No salary advance requests yet" description="Submit a request using the button above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Reason</th>
                  <th className="py-2 pr-4 font-medium">Repayment Plan</th>
                  <th className="py-2 pr-4 font-medium">Date Requested</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Deduction Status</th>
                  <th className="py-2 pr-4 font-medium">Comment</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">ZMW {Number(a.amountRequested).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-gray-600 max-w-xs truncate" title={a.reason}>{a.reason}</td>
                    <td className="py-3 pr-4 text-gray-600">{repaymentPlanLabel(a.repaymentPlan)}</td>
                    <td className="py-3 pr-4 text-gray-500">
                      {a.dateRequested ? new Date(a.dateRequested).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 pr-4"><Badge status={a.status} /></td>
                    <td className="py-3 pr-4 text-gray-500">
                      {a.status !== 'approved' ? '-' : a.recovered ? 'Deducted from a paycheck' : 'Pending next payroll run'}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{a.reviewComment || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={step === 'form' ? 'Request Salary Advance' : 'Confirm Your Request'}
        footer={
          step === 'form' ? (
            <>
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleContinue}>Submit</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleDeny} disabled={submitting}>Deny</Button>
              <Button onClick={handleAccept} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Accept & Send'}
              </Button>
            </>
          )
        }
      >
        {step === 'form' ? (
          <div className="flex flex-col gap-4">
            <Input
              label="Amount Requested (ZMW)"
              type="number"
              step="0.01"
              error={errors.amountRequested?.message}
              {...register('amountRequested', { required: 'Required', min: { value: 0.01, message: 'Must be greater than 0' } })}
            />
            <Input label="Reason" error={errors.reason?.message} {...register('reason', { required: 'Required' })} />
            <Select
              label="Repayment Plan"
              error={errors.repaymentPlan?.message}
              {...register('repaymentPlan', { required: 'Please select a repayment plan' })}
            >
              <option value="">Select a repayment plan</option>
              {REPAYMENT_PLANS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
            <Input label="Date Requested" type="date" value={today} disabled readOnly />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Salary advance will be deducted from your future salary.
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  If approved, the full amount is automatically deducted from your next payroll run.
                  Do you accept and want to send this request?
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600 flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span>Amount Requested</span>
                <span className="font-medium text-gray-900">ZMW {Number(pendingValues?.amountRequested || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Repayment Plan</span>
                <span className="font-medium text-gray-900">{repaymentPlanLabel(pendingValues?.repaymentPlan)}</span>
              </div>
              <div className="flex justify-between">
                <span>Date Requested</span>
                <span className="font-medium text-gray-900">{new Date(today).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
