export default function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-20 bg-emerald-50 rounded-2xl animate-pulse" />
            <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-80 bg-white border border-slate-200 rounded-2xl animate-pulse sticky top-24" />
          </div>
        </div>
      </div>
    </main>
  )
}
