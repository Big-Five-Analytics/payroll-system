import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getTerminatedEmployees } from '../../services/employeeService';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

export default function TerminatedEmployees() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    getTerminatedEmployees({ page, limit: 15 })
      .then(({ data }) => { setRecords(data.data.terminatedEmployees); setPages(data.data.pages); })
      .catch(() => toast.error('Failed to load terminated employee records'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Terminated Employees</h1>
        <p className="text-sm text-gray-500">
          Archived records for employees no longer with the company - excluded from headcount and payroll
        </p>
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : records.length === 0 ? (
          <EmptyState title="No terminated employees" description="Records appear here once an employee is terminated." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-medium">Employee No.</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Department</th>
                <th className="py-2 pr-4 font-medium">Job Title</th>
                <th className="py-2 pr-4 font-medium">Hired</th>
                <th className="py-2 pr-4 font-medium">Terminated</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-mono text-xs text-gray-600">{r.employeeNumber}</td>
                  <td className="py-3 pr-4 font-medium text-gray-900">{r.firstName} {r.lastName}</td>
                  <td className="py-3 pr-4 text-gray-600">{r.departmentName || '-'}</td>
                  <td className="py-3 pr-4 text-gray-600">{r.jobTitle}</td>
                  <td className="py-3 pr-4 text-gray-500">{r.dateOfHire}</td>
                  <td className="py-3 pr-4 text-gray-500">{r.terminationDate}</td>
                  <td className="py-3 pr-4 text-gray-500 max-w-xs truncate" title={r.reason}>{r.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Card>
    </div>
  );
}
