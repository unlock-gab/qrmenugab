export default function WaiterLoading() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-gray-100 rounded-xl mb-4" />
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );
}
