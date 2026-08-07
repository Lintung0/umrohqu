export default function PackageDetailLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-12 sm:pb-16">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-[16/10] bg-slate-200 rounded-2xl animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-20 bg-slate-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
            <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  )
}
