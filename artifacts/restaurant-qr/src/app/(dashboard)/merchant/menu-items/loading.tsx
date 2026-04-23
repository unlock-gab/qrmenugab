export default function MenuItemsLoading() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-pulse">
      <div className="flex justify-between mb-5">
        <div className="h-8 w-40 bg-gray-100 rounded-xl" />
        <div className="h-9 w-36 bg-orange-100 rounded-xl" />
      </div>
      <div className="flex gap-2 mb-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-24 bg-gray-100 rounded-full" />)}
      </div>
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );
}
