import Link from "next/link"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <p className="text-8xl font-bold text-emerald-600/20">404</p>
        <div>
          <h1 className="text-2xl font-bold">Halaman Tidak Ditemukan</h1>
          <p className="text-muted-foreground mt-2">Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            <Home className="w-4 h-4" /> Beranda
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-2 border border-border px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Search className="w-4 h-4" /> Cari Paket
          </Link>
        </div>
      </div>
    </div>
  )
}
