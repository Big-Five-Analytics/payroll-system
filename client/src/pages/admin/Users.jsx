import { useEffect, useState } from 'react';
import { Plus, Ban, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { getUsers, getRoles, createUser, deactivateUser, reactivateUser } from '../../services/userService';
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
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchUsers = () => {
    setLoading(true);
    getUsers({ limit: 50 })
      .then(({ data }) => setUsers(data.data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    getRoles().then(({ data }) => setRoles(data.data)).catch(() => {});
  }, []);

  const onSubmit = async (values) => {
    try {
      await createUser(values);
      toast.success('User created');
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">System users and their access roles</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add User</Button>
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
                  <td className="py-3 pr-4">
                    <Badge status={u.isActive ? 'active' : 'terminated'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right">
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
          <Input label="Password" type="password" className="col-span-2" error={errors.password?.message} {...register('password', { required: 'Required', minLength: 8 })} />
          <Select label="Role" className="col-span-2" error={errors.roleId?.message} {...register('roleId', { required: 'Required' })}>
            <option value="">Select role</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </div>
      </Modal>
    </div>
  );
}
