import clsx from 'clsx';

const styles = {
  draft: 'bg-gray-100 text-gray-700',
  processed: 'bg-blue-100 text-blue-700',
  approved: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-amber-100 text-amber-700',
  terminated: 'bg-red-100 text-red-700',
};

export default function Badge({ status, children }) {
  return (
    <span
      className={clsx(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        styles[status] || 'bg-gray-100 text-gray-700'
      )}
    >
      {children || status}
    </span>
  );
}
