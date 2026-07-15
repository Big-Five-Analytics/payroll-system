import clsx from 'clsx';

export default function Card({ className, children, ...props }) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}
