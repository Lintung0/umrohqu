import Link from "next/link"
import { Home, Search } from "lucide-react"
import { IslamicPattern } from "@/components/ui/islamic-pattern"

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 text-white">
        <IslamicPattern opacity={0.03} />
      </div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-glow/10 rounded-full blur-3xl" />

      <div className="relative text-center space-y-6">
        <p className="text-8xl font-bold text-white/10">404</p>
        <div>
          <h1 className="text-2xl font-bold text-white">Halaman Tidak Ditemukan</h1>
          <p className="text-white/60 mt-2 max-w-md">
            Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-light text-emerald-deep px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all"
          >
            <Home className="w-4 h-4" /> Beranda
          </Link>
          <Link
            href="/packages"
            className="flex items-center gap-2 border border-white/20 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-all"
          >
            <Search className="w-4 h-4" /> Cari Paket
          </Link>
        </div>
      </div>
    </div>
  )
}
