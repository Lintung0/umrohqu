export default function TravelDetailLoading() {
  return (
    <main className="min-h-screen bg-ivory-50">
      <div className="h-64 bg-emerald-deep animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-ivory-card rounded-2xl border border-ivory-border p-6 -mt-16 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-ivory-border rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-ivory-border rounded animate-pulse w-1/3" />
              <div className="h-4 bg-ivory-border rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-ivory-card border border-ivory-border rounded-2xl overflow-hidden">
              <div className="h-48 bg-ivory animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-ivory rounded animate-pulse w-3/4" />
                <div className="h-3 bg-ivory rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
