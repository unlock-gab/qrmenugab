export default function DashboardLoading() {
  return (
    <div className="p-6 animate-pulse space-y-5">
      <div className="h-8 w-48 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
      <div className="h-40 bg-gray-100 rounded-2xl" />
    </div>
  );
}
