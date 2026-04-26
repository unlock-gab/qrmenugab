export default function RestaurantDetailLoading() {
  return (
    <div className="pt-16 animate-pulse">
      <div className="h-56 md:h-72 bg-gray-200 w-full" />
      <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded-xl" />
        <div className="h-4 w-48 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-2xl border border-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
