export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-pulse">
        <div className="mb-8 text-center">
          <div className="h-2 bg-gray-200 rounded-full mb-6">
            <div className="h-2 w-1/4 bg-violet-200 rounded-full" />
          </div>
          <div className="h-7 w-72 bg-gray-200 rounded-xl mx-auto mb-2" />
          <div className="h-4 w-56 bg-gray-100 rounded-xl mx-auto" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-11 bg-gray-100 rounded-xl" />
            </div>
          ))}
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
