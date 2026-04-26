export default function SignupLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-pulse">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-4" />
          <div className="h-8 w-56 bg-gray-200 rounded-xl mx-auto mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded-xl mx-auto" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-11 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-xl border border-gray-100" />
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
