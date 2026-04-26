export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-pulse">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-4" />
          <div className="h-7 w-48 bg-gray-200 rounded-xl mx-auto mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded-xl mx-auto" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-11 bg-gray-100 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-11 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-11 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
