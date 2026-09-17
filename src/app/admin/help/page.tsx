"use client"

import { LifeBuoy, Search, BookOpen, MessageSquare, Phone, Mail, ExternalLink } from "lucide-react"

const FAQ_DATA = [
  { q: "Bagaimana cara mendaftarkan travel baru?", a: "Travel dapat mendaftar langsung melalui halaman pendaftaran. Isi data lengkap, upload dokumen, dan tim kami akan memverifikasi dalam 1-3 hari kerja." },
  { q: "Bagaimana mengatur biaya service fee?", a: "Admin dapat mengatur biaya service fee melalui menu Konfigurasi Biaya. Fee dapat berupa persentase atau flat fee per transaksi." },
  { q: "Cara mengaktifkan/menonaktifkan template?", a: "Pergi ke menu Template Website, pilih template yang ingin diaktifkan/nonaktifkan, lalu klik toggle status." },
  { q: "Bagaimana proses payout ke travel?", a: "Payout dilakukan secara otomatis sesuai jadwal (tanggal 1 & 15). Minimum payout dapat dikonfigurasi di menu Konfigurasi Biaya." },
  { q: "Cara menangani tiket dari travel?", a: "Buka menu Tiket Kendala, pilih tiket yang belum ditangani, lalu klik Balas untuk memberikan respons. Ubah status tiket setelah masalah terselesaikan." },
]

export default function AdminHelpPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bantuan Pengguna</h1>
        <p className="text-muted-foreground mt-1">Pusat bantuan untuk admin, travel, dan jamaah</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari bantuan..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: "Panduan Admin", color: "bg-emerald-100 text-emerald-600" },
          { icon: BookOpen, label: "Panduan Travel", color: "bg-blue-100 text-blue-600" },
          { icon: MessageSquare, label: "FAQ Umum", color: "bg-purple-100 text-purple-600" },
          { icon: Phone, label: "Hubungi Support", color: "bg-amber-100 text-amber-600" },
        ].map((item) => (
          <button key={item.label} className="bg-white border border-border rounded-2xl p-4 text-center hover:bg-gray-50 transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} mx-auto mb-2`}>
              <item.icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium">{item.label}</p>
          </button>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">FAQ Sering Ditanyakan</h2>
        </div>
        <div className="divide-y divide-border">
          {FAQ_DATA.map((faq, idx) => (
            <details key={idx} className="group">
              <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors">
                <p className="text-sm font-medium pr-4">{faq.q}</p>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-muted-foreground">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <LifeBuoy className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-emerald-800">Butuh Bantuan Lebih?</h3>
        </div>
        <p className="text-sm text-emerald-700 mb-3">Tim support kami siap membantu Anda 24/7</p>
        <div className="flex gap-3">
          <a href="mailto:support@umrohq.com" className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Mail className="w-4 h-4" /> support@umrohq.com
          </a>
          <a href="https://wa.me/6281234567890" className="flex items-center gap-1.5 px-4 py-2 border border-emerald-300 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors">
            <Phone className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
