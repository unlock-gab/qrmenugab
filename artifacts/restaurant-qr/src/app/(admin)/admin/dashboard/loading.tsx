export default function AdminDashboardLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-56 bg-slate-800 rounded-xl mb-2" />
        <div className="h-4 w-80 bg-slate-800/60 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="h-5 w-40 bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-slate-700 rounded" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-6 py-3 border-b border-slate-800/50">
            {[...Array(5)].map((_, j) => <div key={j} className="h-4 flex-1 bg-slate-800 rounded" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
