import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDepartments, createDepartment } from '../../services/employeeService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import { useForm } from 'react-hook-form';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchDepartments = () => {
    setLoading(true);
    getDepartments()
      .then(({ data }) => setDepartments(data.data))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDepartments(); }, []);

  const onSubmit = async (values) => {
    try {
      await createDepartment(values);
      toast.success('Department created');
      reset();
      setModalOpen(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500">Organizational departments used across the system</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Department</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <div key={d.id} className="rounded-lg border border-gray-200 p-4">
                <p className="font-medium text-gray-900">{d.name}</p>
                <p className="text-sm text-gray-500 mt-1">{d.description || 'No description'}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Department"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Name" {...register('name', { required: true })} />
          <Input label="Description" {...register('description')} />
        </div>
      </Modal>
    </div>
  );
}
