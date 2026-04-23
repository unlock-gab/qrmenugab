export default function ReservationsLoading() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-44 bg-gray-100 rounded-xl mb-5" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );
}
