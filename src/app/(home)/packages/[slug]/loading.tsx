export default function PackageDetailLoading() {
  return (
    <main className="min-h-screen bg-ivory">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-12 sm:pb-16">
        <div className="h-4 w-32 bg-ivory-border rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-[4/3] bg-ivory-border rounded-2xl animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-20 bg-ivory-border rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-7 bg-ivory-border rounded animate-pulse w-2/3" />
            <div className="h-4 bg-ivory-border rounded animate-pulse w-1/3" />
            <div className="h-10 bg-ivory-card border border-ivory-border rounded-xl animate-pulse" />
          </div>
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 bg-ivory-card border border-ivory-border rounded-2xl p-5 space-y-3">
              <div className="h-7 bg-ivory-border rounded animate-pulse w-1/2" />
              <div className="h-4 bg-ivory-border rounded animate-pulse w-3/4" />
              <div className="h-12 bg-ivory-border rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
