export default function TravelDetailLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="h-64 bg-gradient-to-br from-emerald-800 to-emerald-600 animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 -mt-16 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-slate-200 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-slate-200 rounded animate-pulse w-1/3" />
              <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="h-48 bg-slate-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
