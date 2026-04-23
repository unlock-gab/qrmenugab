export default function OrdersLoading() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto animate-pulse">
      <div className="h-8 w-40 bg-gray-100 rounded-xl mb-4" />
      <div className="flex gap-2 mb-5">
        {[...Array(5)].map((_, i) => <div key={i} className="h-9 w-24 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );
}
