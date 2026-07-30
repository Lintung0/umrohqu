"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronDown, ChevronUp, HelpCircle, ExternalLink } from "lucide-react"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const STATIC_FAQS: FAQItem[] = [
  {
    id: "1",
    category: "Umum",
    question: "Apa itu UmrahQu?",
    answer: "UmrahQu adalah platform pencarian dan perbandingan paket umroh terpercaya di Indonesia. Kami membantu jamaah menemukan paket umroh terbaik dari travel-travel terverifikasi, serta membantu travel mengelola bisnis mereka secara digital."
  },
  {
    id: "2",
    category: "Travel",
    question: "Bagaimana cara mendaftar sebagai travel di UmrahQu?",
    answer: 'Travel dapat mendaftar langsung melalui halaman <a href="/register/travel" class="text-emerald-600 hover:underline font-medium">Daftar Travel</a>. Isi data travel dan admin, kemudian tim kami akan memverifikasi dalam 1-3 hari kerja. Setelah diverifikasi, travel dapat membayar setup fee untuk mengaktifkan subdomain, website, dan dashboard travel.'
  },
  {
    id: "3",
    category: "Travel",
    question: "Berapa biaya setup untuk travel?",
    answer: "Biaya setup fee adalah Rp5.000.000 (satu kali bayar). Biaya ini mencakup pembuatan subdomain khusus travel Anda, template website landing page profesional, akses dashboard travel, integrasi sistem pembayaran, dan dukungan teknis."
  },
  {
    id: "4",
    category: "Travel",
    question: "Apa itu sistem deposit/saldo untuk travel?",
    answer: "Setelah aktif, travel dapat mengisi saldo dompet melalui fitur Topup. Saldo ini digunakan untuk membayar service fee platform per transaksi booking. Sistem ini seperti ATM — isi saldo dulu, baru bisa transaksi. Topup dapat dilakukan via Xendit (virtual account, QRIS, kartu kredit)."
  },
  {
    id: "5",
    category: "Travel",
    question: "Bagaimana cara travel mendapat pesanan?",
    answer: "Setelah paket umroh dipublikasikan, paket akan tampil di halaman pencarian UmrahQu. Jamaah dapat mencari, membandingkan, dan memesan langsung paket travel Anda. Travel akan menerima notifikasi setiap ada pesanan baru melalui dashboard."
  },
  {
    id: "6",
    category: "Jamaah",
    question: "Bagaimana cara memesan paket umroh?",
    answer: 'Cukup cari paket umroh di halaman <a href="/search" class="text-emerald-600 hover:underline font-medium">Pencarian</a>, pilih paket yang diinginkan, lalu klik "Pesan Sekarang". Isi data diri dan peserta, pilih metode pembayaran, dan selesaikan pembayaran via Xendit.'
  },
  {
    id: "7",
    category: "Jamaah",
    question: "Metode pembayaran apa saja yang tersedia?",
    answer: "Pembayaran dapat dilakukan melalui Virtual Account (BCA, Mandiri, BRI, BNI), QRIS (GoPay, OVO, DANA, ShopeePay), dan Kartu Kredit. Semua pembayaran diproses melalui Xendit yang terpercaya."
  },
  {
    id: "8",
    category: "Jamaah",
    question: "Apakah bisa booking dengan sistem DP?",
    answer: "Ya, tersedia opsi pembayaran DP (Down Payment) untuk paket tertentu. Anda dapat membayar DP terlebih dahulu, kemudian melunasi sisa pembayaran sebelum tanggal keberangkatan."
  },
  {
    id: "9",
    category: "Jamaah",
    question: "Bagaimana jika booking dibatalkan?",
    answer: "Kebijakan pembatalan tergantung pada masing-masing travel partner. Silakan cek syarat dan ketentuan pada halaman detail paket sebelum melakukan pemesanan. Hubungi travel terkait untuk informasi lebih lanjut."
  },
  {
    id: "10",
    category: "Akun",
    question: "Bagaimana cara mendaftar akun?",
    answer: 'Anda dapat mendaftar sebagai jamaah di halaman <a href="/register" class="text-emerald-600 hover:underline font-medium">Daftar</a>. Cukup isi nama, email, dan password. Jika Anda adalah travel dan ingin mendaftar sebagai mitra, gunakan halaman <a href="/register/travel" class="text-emerald-600 hover:underline font-medium">Daftar Travel</a>.'
  },
  {
    id: "11",
    category: "Akun",
    question: "Saya sudah daftar sebagai jamaah, bisa upgrade jadi travel?",
    answer: 'Bisa! Silakan hubungi tim kami melalui WhatsApp atau daftar ulang di halaman <a href="/register/travel" class="text-emerald-600 hover:underline font-medium">Daftar Travel</a> dengan email yang berbeda. Atau hubungi admin untuk mengubah role akun Anda.'
  },
]

const CATEGORIES = ["Semua", "Umum", "Travel", "Jamaah", "Akun"]

export default function FAQPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Semua")
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = STATIC_FAQS.filter((f) => {
    if (category !== "Semua" && f.category !== category) return false
    if (search && !f.question.toLowerCase().includes(search.toLowerCase()) && !f.answer.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <HelpCircle className="w-12 h-12 mx-auto opacity-80" />
          <h1 className="text-3xl font-bold">Pertanyaan Umum</h1>
          <p className="text-emerald-100">Temukan jawaban atas pertanyaan yang sering ditanyakan</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 -mt-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pertanyaan..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <p className="text-muted-foreground">Tidak ada pertanyaan ditemukan</p>
              <button
                onClick={() => { setSearch(""); setCategory("Semua") }}
                className="text-sm text-emerald-600 hover:underline mt-2"
              >
                Reset filter
              </button>
            </div>
          ) : (
            filtered.map((faq) => (
              <div key={faq.id} className="bg-white rounded-2xl border border-border overflow-hidden transition-shadow hover:shadow-sm">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">{faq.category}</span>
                    <span className="font-medium text-sm">{faq.question}</span>
                  </div>
                  {openId === faq.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                  )}
                </button>
                {openId === faq.id && (
                  <div
                    className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
          <div>
            <p className="font-semibold text-emerald-800">Belum menemukan jawaban?</p>
            <p className="text-sm text-emerald-700 mt-1">Hubungi kami via WhatsApp di <strong>+62 82232169960</strong></p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-emerald-300 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-50 transition-colors"
            >
              Daftar sebagai Jamaah
            </Link>
            <Link
              href="/register/travel"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Daftar sebagai Travel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
