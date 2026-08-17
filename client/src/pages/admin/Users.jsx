import { useEffect, useState } from 'react';
import { Plus, Ban, CheckCircle2, Copy, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  getUsers,
  getRoles,
  createUser,
  deactivateUser,
  reactivateUser,
  resetUserPassword,
  getEmployeesWithoutAccount,
} from '../../services/userService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employeesWithoutAccount, setEmployeesWithoutAccount] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [createdCredential, setCreatedCredential] = useState(null); // { email, defaultPassword }
  const [resetCredential, setResetCredential] = useState(null); // { email, newPassword }
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();

  const selectedRoleId = watch('roleId');
  const selectedRoleName = roles.find((r) => r.id === selectedRoleId)?.name;
  const isEmployeeRole = selectedRoleName === 'Employee';

  const fetchUsers = () => {
    setLoading(true);
    getUsers({ limit: 50 })
      .then(({ data }) => setUsers(data.data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  const fetchEmployeesWithoutAccount = () => {
    getEmployeesWithoutAccount()
      .then(({ data }) => setEmployeesWithoutAccount(data.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUsers();
    getRoles().then(({ data }) => setRoles(data.data)).catch(() => {});
  }, []);

  const openModal = () => {
    fetchEmployeesWithoutAccount();
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const { data } = await createUser(values);
      toast.success('User created');
      setCreatedCredential({ email: values.email, defaultPassword: data.data.defaultPassword });
      reset();
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const toggleActive = async (user) => {
    try {
      if (user.isActive) await deactivateUser(user.id);
      else await reactivateUser(user.id);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const copyCredential = () => {
    navigator.clipboard.writeText(
      `Email: ${createdCredential.email}\nDefault password: ${createdCredential.defaultPassword}`
    );
    toast.success('Copied to clipboard');
  };

  const handleResetPassword = async (user) => {
    try {
      const { data } = await resetUserPassword(user.id);
      setResetCredential({ email: user.email, newPassword: data.data.newPassword });
      fetchUsers();
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const copyResetCredential = () => {
    navigator.clipboard.writeText(
      `Email: ${resetCredential.email}\nNew password: ${resetCredential.newPassword}`
    );
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">System users and their access roles</p>
        </div>
        <Button onClick={openModal}><Plus size={16} /> Add User</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Linked Employee</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                  <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                  <td className="py-3 pr-4 text-gray-600">{u.role?.name}</td>
                  <td className="py-3 pr-4 text-gray-500">
                    {u.employee ? `${u.employee.firstName} ${u.employee.lastName} (${u.employee.employeeNumber})` : '-'}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge status={u.isActive ? 'active' : 'terminated'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <button
                      onClick={() => handleResetPassword(u)}
                      title="Reset password"
                      className="text-gray-400 hover:text-brand-600 mr-3"
                    >
                      <KeyRound size={16} />
                    </button>
                    <button onClick={() => toggleActive(u)} className="text-gray-400 hover:text-brand-600">
                      {u.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" error={errors.firstName?.message} {...register('firstName', { required: 'Required' })} />
          <Input label="Last Name" error={errors.lastName?.message} {...register('lastName', { required: 'Required' })} />
          <Input label="Email" type="email" className="col-span-2" error={errors.email?.message} {...register('email', { required: 'Required' })} />
          <Select label="Role" className="col-span-2" error={errors.roleId?.message} {...register('roleId', { required: 'Required' })}>
            <option value="">Select role</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>

          {selectedRoleId && (
            <Select
              label={isEmployeeRole ? 'Linked Employee Record' : 'Linked Employee Record (optional)'}
              className="col-span-2"
              error={errors.employeeId?.message}
              {...register('employeeId', { required: isEmployeeRole ? 'Required for an Employee-role account' : false })}
            >
              <option value="">{isEmployeeRole ? 'Select employee' : "None - this person isn't an employee"}</option>
              {employeesWithoutAccount.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                </option>
              ))}
            </Select>
          )}

          {!isEmployeeRole && selectedRoleId && (
            <p className="col-span-2 text-xs text-gray-500 -mt-2">
              HR and Finance staff are often employees of the company too - link their record here
              so they can also apply for their own leave, salary advances, and view their payslips.
            </p>
          )}

          <p className="col-span-2 text-xs text-gray-500">
            A random default password will be generated automatically and shown once after saving -
            share it with the user securely. They'll be reminded to change it after logging in.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!createdCredential}
        onClose={() => setCreatedCredential(null)}
        title="User Created"
        footer={<Button onClick={() => setCreatedCredential(null)}>Done</Button>}
      >
        {createdCredential && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              Share these credentials with the user through a secure channel. This password is shown only once.
            </p>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 font-mono text-sm flex items-center justify-between">
              <div>
                <p>Email: {createdCredential.email}</p>
                <p>Password: {createdCredential.defaultPassword}</p>
              </div>
              <button onClick={copyCredential} className="text-gray-400 hover:text-brand-600">
                <Copy size={16} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!resetCredential}
        onClose={() => setResetCredential(null)}
        title="Password Reset"
        footer={<Button onClick={() => setResetCredential(null)}>Done</Button>}
      >
        {resetCredential && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              Share this new password with the user through a secure channel. This password is shown only once.
            </p>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 font-mono text-sm flex items-center justify-between">
              <div>
                <p>Email: {resetCredential.email}</p>
                <p>New password: {resetCredential.newPassword}</p>
              </div>
              <button onClick={copyResetCredential} className="text-gray-400 hover:text-brand-600">
                <Copy size={16} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
