import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { createEmployee, updateEmployee } from '../../services/employeeService';

export default function EmployeeFormModal({ open, onClose, onSaved, employee, departments }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (open) {
      reset(
        employee
          ? {
              ...employee,
              dateOfHire: employee.dateOfHire?.slice(0, 10),
              departmentId: employee.department?.id,
            }
          : {}
      );
    }
  }, [open, employee, reset]);

  const onSubmit = async (values) => {
    try {
      if (employee) {
        await updateEmployee(employee.id, values);
        toast.success('Employee updated');
      } else {
        await createEmployee(values);
        toast.success('Employee created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? 'Edit Employee' : 'Add Employee'}
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
        <Input label="First Name" error={errors.firstName?.message} {...register('firstName', { required: 'Required' })} />
        <Input label="Last Name" error={errors.lastName?.message} {...register('lastName', { required: 'Required' })} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Required' })} />
        <Input label="Phone" {...register('phone')} />
        <Input label="National ID" error={errors.nationalId?.message} {...register('nationalId', { required: 'Required' })} />
        <Input label="NAPSA Number" {...register('napsaNumber')} />
        <Input label="NHIMA Number" {...register('nhimaNumber')} />
        <Input label="TPIN" {...register('tpin')} />
        <Select label="Department" error={errors.departmentId?.message} {...register('departmentId', { required: 'Required' })}>
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        <Input label="Job Title" error={errors.jobTitle?.message} {...register('jobTitle', { required: 'Required' })} />
        <Input label="Date of Hire" type="date" error={errors.dateOfHire?.message} {...register('dateOfHire', { required: 'Required' })} />
        <Input label="Basic Salary (ZMW)" type="number" step="0.01" error={errors.basicSalary?.message} {...register('basicSalary', { required: 'Required', min: 0 })} />
        <Input label="Bank Name" {...register('bankName')} />
        <Input label="Bank Account Number" {...register('bankAccountNumber')} />
        {employee && (
          <Select label="Status" {...register('status')}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </Select>
        )}
      </form>
    </Modal>
  );
}
