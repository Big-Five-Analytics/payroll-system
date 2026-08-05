import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { createGeneralWorker, updateGeneralWorker } from '../../services/generalWorkerService';

export default function GeneralWorkerFormModal({ open, onClose, onSaved, worker, sites }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (open) {
      reset(
        worker
          ? {
              ...worker,
              contractStartDate: worker.contractStartDate?.slice(0, 10),
              contractEndDate: worker.contractEndDate?.slice(0, 10),
            }
          : {}
      );
    }
  }, [open, worker, reset]);

  const onSubmit = async (values) => {
    try {
      if (worker) {
        await updateGeneralWorker(worker.id, values);
        toast.success('Worker updated');
      } else {
        await createGeneralWorker(values);
        toast.success('Worker added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save worker');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={worker ? 'Edit General Worker' : 'Add General Worker'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Worker Details</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" error={errors.fullName?.message} {...register('fullName', { required: 'Required' })} />
            <Input label="Site" list="site-options" error={errors.site?.message} {...register('site', { required: 'Required' })} />
            <datalist id="site-options">
              {sites.map((s) => <option key={s} value={s} />)}
            </datalist>
            <Input label="Trade / Role" {...register('jobTitle')} />
            <Input label="Contract Start Date" type="date" {...register('contractStartDate')} />
            <Input label="Contract End Date" type="date" {...register('contractEndDate')} />
            <Input label="Leave Balance (days)" type="number" step="0.5" {...register('leaveBalance')} />
            {worker && (
              <Select label="Status" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Monthly Wage Bill (optional)</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Hourly / Pay Rate (ZMW)" type="number" step="0.01" {...register('payRate')} />
            <Select label="Rate Type" {...register('payRateType')}>
              <option value="">Not set</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </Select>
            <div />
            <Input label="Days Worked (Mon-Fri)" type="number" {...register('daysWorkedWeekday')} />
            <Input label="Saturdays Worked" type="number" {...register('daysWorkedSaturday')} />
            <Input label="Sundays/PH Worked" type="number" {...register('daysWorkedSundayPH')} />
            <Input label="Normal Hours (Mon-Fri)" type="number" step="0.01" {...register('normalHoursWeekday')} />
            <Input label="Normal Hours (Sat)" type="number" step="0.01" {...register('normalHoursSaturday')} />
            <Input label="Total Normal Hours" type="number" step="0.01" {...register('totalNormalHours')} />
            <Input label="Monthly Total Normal Hours" type="number" step="0.01" {...register('monthlyNormalHoursTarget')} />
            <Input label="Basic Pay" type="number" step="0.01" {...register('basicPay')} />
            <div />
            <Input label="OT Hours (Weekdays)" type="number" step="0.01" {...register('otHoursWeekday')} />
            <Input label="OT Pay (Weekdays)" type="number" step="0.01" {...register('otPayWeekday')} />
            <div />
            <Input label="OT Hours (Saturday)" type="number" step="0.01" {...register('otHoursSaturday')} />
            <Input label="OT Pay (1.5x)" type="number" step="0.01" {...register('otPaySaturday')} />
            <div />
            <Input label="OT Hours (Sunday/PH)" type="number" step="0.01" {...register('otHoursSundayPH')} />
            <Input label="OT Pay (2.0x)" type="number" step="0.01" {...register('otPaySundayPH')} />
            <div />
            <Input label="Housing Allowance" type="number" step="0.01" {...register('housingAllowance')} />
            <Input label="Transport Allowance" type="number" step="0.01" {...register('transportAllowance')} />
            <Input label="Total Pay" type="number" step="0.01" {...register('totalPay')} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
