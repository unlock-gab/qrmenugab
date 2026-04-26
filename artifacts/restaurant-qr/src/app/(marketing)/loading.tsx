export default function MarketingLoading() {
  return (
    <div className="animate-pulse pt-16">
      <div className="bg-white border-b border-gray-100 py-3 px-5">
        <div className="max-w-2xl mx-auto h-10 bg-gray-100 rounded-full" />
      </div>
      <div className="w-full h-[420px] md:h-[500px] bg-gray-200" />
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-5 space-y-6">
          <div className="h-7 w-64 bg-gray-100 rounded-xl" />
          <div className="h-4 w-80 bg-gray-100 rounded-xl" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="shrink-0 w-64">
                <div className="h-52 rounded-2xl bg-gray-100" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
