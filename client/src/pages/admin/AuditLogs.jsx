import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAuditLogs } from '../../services/userService';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import Pagination from '../../components/ui/Pagination';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    getAuditLogs({ page, limit: 25 })
      .then(({ data }) => { setLogs(data.data.logs); setPages(data.data.pages); })
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500">System activity trail for compliance and security review</p>
      </div>

      <Card className="p-4">
        {loading ? (
          <Loader />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-medium">Timestamp</th>
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="py-2 pr-4 font-medium">Entity</th>
                <th className="py-2 pr-4 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-gray-900">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{log.action}</td>
                  <td className="py-2 pr-4 text-gray-600">{log.entityType || '-'}</td>
                  <td className="py-2 pr-4 text-gray-400">{log.ipAddress || '-'}</td>
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
