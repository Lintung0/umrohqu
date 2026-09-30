export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-ivory-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="h-6 bg-ivory-border rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-ivory-border rounded animate-pulse w-28" />
      </div>
      <div className="sticky top-16 z-40 bg-ivory-card border-b border-ivory-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-11 bg-ivory-border rounded-full animate-pulse max-w-2xl" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-ivory-border rounded-full animate-pulse" />
          ))}
        </div>
        <div className="flex gap-8">
          <div className="hidden lg:block w-64 shrink-0">
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2.5">
                  <div className="h-3 w-24 bg-ivory-border rounded animate-pulse" />
                  <div className="h-10 bg-ivory-border rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-ivory-card rounded-xl overflow-hidden border border-ivory-border shadow-sm">
                  <div className="aspect-[4/3] bg-ivory-border animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-ivory-border rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-ivory-border rounded animate-pulse w-1/2" />
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
