export default function AdminLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-56 bg-slate-800 rounded-xl mb-2" />
      <div className="h-4 w-80 bg-slate-800/60 rounded-lg mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-slate-800/40 rounded-2xl border border-slate-700/50" />
    </div>
  );
}
