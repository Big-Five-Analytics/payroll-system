export default function EmptyState({ title = 'Nothing here yet', description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
      <p className="font-medium text-gray-700">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}
