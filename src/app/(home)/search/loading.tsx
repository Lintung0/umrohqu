export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-32 bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl animate-pulse mb-6" />
        <div className="h-14 bg-white border border-slate-200 rounded-xl animate-pulse mb-5 max-w-3xl" />
        <div className="flex gap-2 mb-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="flex gap-7">
          <div className="hidden lg:block w-72 shrink-0">
            <div className="h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="h-48 bg-slate-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
