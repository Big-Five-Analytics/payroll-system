import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  getOfficeNetworks,
  createOfficeNetwork,
  updateOfficeNetwork,
  deleteOfficeNetwork,
} from '../../services/officeNetworkService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';

export default function OfficeNetworks() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchNetworks = () => {
    setLoading(true);
    getOfficeNetworks()
      .then(({ data }) => setNetworks(data.data))
      .catch(() => toast.error('Failed to load office networks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNetworks(); }, []);

  const onSubmit = async (values) => {
    try {
      await createOfficeNetwork(values);
      toast.success('Office network added');
      reset();
      setModalOpen(false);
      fetchNetworks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add office network');
    }
  };

  const toggleActive = async (network) => {
    try {
      await updateOfficeNetwork(network.id, { isActive: !network.isActive });
      fetchNetworks();
    } catch {
      toast.error('Failed to update office network');
    }
  };

  const handleDelete = async (network) => {
    if (!confirm(`Remove "${network.label}"? Employees on this network will no longer be able to clock in/out.`)) return;
    try {
      await deleteOfficeNetwork(network.id);
      toast.success('Office network removed');
      fetchNetworks();
    } catch {
      toast.error('Failed to remove office network');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Office Networks</h1>
          <p className="text-sm text-gray-500">
            IP addresses or ranges that count as "at the office" for attendance clock-in/out
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Network</Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : networks.length === 0 ? (
          <EmptyState
            title="No office networks configured"
            description="Until at least one active entry exists, nobody can clock in or out."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-medium">Label</th>
                <th className="py-2 pr-4 font-medium">IP / CIDR Range</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {networks.map((n) => (
                <tr key={n.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-900">{n.label}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-gray-600">{n.ipRange}</td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => toggleActive(n)}
                      className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                        n.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {n.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <button onClick={() => handleDelete(n)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
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
        title="Add Office Network"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Label" placeholder="e.g. Head Office - Lusaka" error={errors.label?.message} {...register('label', { required: 'Required' })} />
          <Input
            label="IP Address or CIDR Range"
            placeholder="e.g. 41.63.12.4 or 41.63.12.0/24"
            error={errors.ipRange?.message}
            {...register('ipRange', { required: 'Required' })}
          />
        </div>
      </Modal>
    </div>
  );
}
