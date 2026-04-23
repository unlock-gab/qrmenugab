export default function ReportsLoading() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto animate-pulse">
      <div className="h-8 w-40 bg-gray-100 rounded-xl mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );
}
