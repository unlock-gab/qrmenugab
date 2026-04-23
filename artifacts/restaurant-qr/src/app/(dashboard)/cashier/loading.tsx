export default function CashierLoading() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-pulse">
      <div className="flex justify-between mb-6">
        <div className="h-8 w-36 bg-gray-100 rounded-xl" />
        <div className="h-8 w-28 bg-gray-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );
}
