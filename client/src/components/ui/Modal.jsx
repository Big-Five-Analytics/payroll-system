import clsx from 'clsx';
import { X } from 'lucide-react';

const sizes = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
};

export default function Modal({ open, onClose, title, children, footer, size = 'lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={clsx('w-full rounded-xl bg-white shadow-xl', sizes[size] || sizes.lg)}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
