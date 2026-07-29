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
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-2 gap-4" onSubmit={(e) => e.preventDefault()}>
        <Input label="Full Name" error={errors.fullName?.message} {...register('fullName', { required: 'Required' })} />
        <Input label="Site" list="site-options" error={errors.site?.message} {...register('site', { required: 'Required' })} />
        <datalist id="site-options">
          {sites.map((s) => <option key={s} value={s} />)}
        </datalist>
        <Input label="National ID / NRC" {...register('nationalId')} />
        <Input label="Worker Number" {...register('workerNumber')} />
        <Input label="Job Title" {...register('jobTitle')} />
        <Input label="Pay Rate (ZMW)" type="number" step="0.01" {...register('payRate')} />
        <Select label="Pay Rate Type" {...register('payRateType')}>
          <option value="">Not set</option>
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
        </Select>
        <Input label="Phone" {...register('phone')} />
        <Input label="Next of Kin Name" {...register('nextOfKinName')} />
        <Input label="Next of Kin Phone" {...register('nextOfKinPhone')} />
        <Input label="Contract Start Date" type="date" {...register('contractStartDate')} />
        <Input label="Contract End Date" type="date" {...register('contractEndDate')} />
        <Input label="Leave Balance (days)" type="number" step="0.5" {...register('leaveBalance')} />
        {worker && (
          <Select label="Status" {...register('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        )}
      </form>
    </Modal>
  );
}
