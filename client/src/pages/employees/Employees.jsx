import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees, deleteEmployee, getDepartments } from '../../services/employeeService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import EmployeeFormModal from './EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';

export default function Employees() {
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const canEdit = hasRole('Administrator', 'HR Officer');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getEmployees({ page, limit: 10, search });
      setEmployees(data.data.employees);
      setPages(data.data.pages);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    getDepartments().then(({ data }) => setDepartments(data.data)).catch(() => {});
  }, []);

  const handleDelete = async (employee) => {
    if (!confirm(`Terminate ${employee.firstName} ${employee.lastName}? This preserves payroll history.`)) return;
    try {
      await deleteEmployee(employee.id);
      toast.success('Employee terminated');
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate employee');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500">Manage employee records and department assignment</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={16} /> Add Employee
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by name, email, or employee no."
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>

        {loading ? (
          <Loader />
        ) : employees.length === 0 ? (
          <EmptyState title="No employees found" description="Try adjusting your search or add a new employee." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">Employee No.</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Department</th>
                  <th className="py-2 pr-4 font-medium">Job Title</th>
                  <th className="py-2 pr-4 font-medium">Basic Salary</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  {canEdit && <th className="py-2 pr-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-600">{emp.employeeNumber}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900">{emp.firstName} {emp.lastName}</td>
                    <td className="py-3 pr-4 text-gray-600">{emp.department?.name || '-'}</td>
                    <td className="py-3 pr-4 text-gray-600">{emp.jobTitle}</td>
                    <td className="py-3 pr-4 text-gray-600">ZMW {Number(emp.basicSalary).toLocaleString()}</td>
                    <td className="py-3 pr-4"><Badge status={emp.status} /></td>
                    {canEdit && (
                      <td className="py-3 pr-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditing(emp); setModalOpen(true); }}
                            className="text-gray-400 hover:text-brand-600"
                          >
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(emp)} className="text-gray-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Card>

      <EmployeeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); fetchEmployees(); }}
        employee={editing}
        departments={departments}
      />
    </div>
  );
}
