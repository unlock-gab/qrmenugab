export default function RestaurantsLoading() {
  return (
    <div className="pt-16 animate-pulse">
      <div className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-5">
          <div className="h-8 w-56 bg-gray-200 rounded-xl mb-2" />
          <div className="h-5 w-80 bg-gray-100 rounded-xl mb-6" />
          <div className="h-12 bg-white rounded-full border border-gray-200" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 bg-gray-100 rounded" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
                <div className="h-3 w-full bg-gray-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
