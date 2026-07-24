import { useEffect, useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLeaveApplications, reviewLeaveApplication } from '../../services/leaveService';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';

export default function LeaveApprovals() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [reviewTarget, setReviewTarget] = useState(null); // { application, decision }
  const [comment, setComment] = useState('');

  const fetchApplications = useCallback(() => {
    setLoading(true);
    getLeaveApplications({ status: status || undefined, page, limit: 10 })
      .then(({ data }) => { setApplications(data.data.applications); setPages(data.data.pages); })
      .catch(() => toast.error('Failed to load leave applications'))
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const openReview = (application, decision) => {
    setReviewTarget({ application, decision });
    setComment('');
  };

  const submitReview = async () => {
    try {
      await reviewLeaveApplication(reviewTarget.application.id, reviewTarget.decision, comment);
      toast.success(`Leave application ${reviewTarget.decision}`);
      setReviewTarget(null);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Leave Approvals</h1>
        <p className="text-sm text-gray-500">Review and decide on employee leave applications</p>
      </div>

      <Card className="p-4">
        <Select className="w-40 mb-4" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>

        {loading ? (
          <Loader />
        ) : applications.length === 0 ? (
          <EmptyState title="No leave applications" description="Nothing matches this filter right now." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-medium">Employee</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Dates</th>
                <th className="py-2 pr-4 font-medium">Days</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-900">
                    {a.employee.firstName} {a.employee.lastName}
                    <div className="text-xs text-gray-400">{a.employee.department?.name}</div>
                  </td>
                  <td className="py-3 pr-4 capitalize text-gray-600">{a.leaveType}</td>
                  <td className="py-3 pr-4 text-gray-600">{a.startDate} → {a.endDate}</td>
                  <td className="py-3 pr-4 text-gray-600">{a.numberOfDays}</td>
                  <td className="py-3 pr-4 text-gray-600 max-w-xs truncate" title={a.reason}>{a.reason}</td>
                  <td className="py-3 pr-4"><Badge status={a.status} /></td>
                  <td className="py-3 pr-4 text-right">
                    {a.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openReview(a, 'approved')} className="text-gray-400 hover:text-green-600">
                          <Check size={16} />
                        </button>
                        <button onClick={() => openReview(a, 'rejected')} className="text-gray-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Card>

      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={reviewTarget ? `${reviewTarget.decision === 'approved' ? 'Approve' : 'Reject'} Leave Application` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button variant={reviewTarget?.decision === 'rejected' ? 'danger' : 'primary'} onClick={submitReview}>
              Confirm {reviewTarget?.decision === 'approved' ? 'Approval' : 'Rejection'}
            </Button>
          </>
        }
      >
        <Input label="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Modal>
    </div>
  );
}
