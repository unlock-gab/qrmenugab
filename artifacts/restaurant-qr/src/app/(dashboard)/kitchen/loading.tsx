export default function KitchenLoading() {
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-700 rounded-xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 w-24 bg-gray-700 rounded-xl" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-2xl p-4 h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}
