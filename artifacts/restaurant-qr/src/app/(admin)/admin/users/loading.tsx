export default function Loading() {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-48 bg-slate-800 rounded-xl mb-2" />
          <div className="h-4 w-64 bg-slate-800/60 rounded-lg" />
        </div>
        <div className="h-10 w-40 bg-slate-800 rounded-xl" />
      </div>
      <div className="flex gap-2 mb-6">
        {[...Array(5)].map((_, i) => <div key={i} className="h-8 w-20 bg-slate-800 rounded-lg" />)}
      </div>
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="border-b border-slate-700/50 p-4 flex gap-8">
          {[...Array(7)].map((_, i) => <div key={i} className="h-4 flex-1 bg-slate-700 rounded" />)}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border-b border-slate-800/50 p-4 flex gap-8">
            {[...Array(7)].map((_, j) => <div key={j} className="h-4 flex-1 bg-slate-800 rounded" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
