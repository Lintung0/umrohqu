export default function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-ivory-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="h-4 w-40 bg-ivory-border rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-20 bg-emerald-dark/10 rounded-2xl animate-pulse" />
            <div className="h-64 bg-ivory-card border border-ivory-border rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-80 bg-ivory-card border border-ivory-border rounded-2xl animate-pulse sticky top-24" />
          </div>
        </div>
      </div>
    </main>
  )
}
