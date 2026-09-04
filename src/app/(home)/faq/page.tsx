"use client"

import { useState } from "react"
import { Search, ChevronDown, HelpCircle, Sparkles, MessageCircle } from "lucide-react"
import Link from "next/link"

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
    answer: 'Cukup cari paket umroh di halaman <a href="/search" class="text-emerald-600 hover:underline font-medium">Pencarian</a>, pilih paket yang diinginkan, lalu klik "Pesan". Isi data diri dan peserta, pilih metode pembayaran, dan selesaikan pembayaran via Xendit.'
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
      {/* Hero */}
      <div className="relative overflow-hidden bg-emerald-950 text-white py-20 px-6">
        {/* Makkah background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-makkah.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-900/80 to-emerald-800/75" aria-hidden />
        {/* Islamic star pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="faq-islamic-star" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <polygon points="30,2 35,22 55,22 40,34 46,54 30,42 14,54 20,34 5,22 25,22" fill="none" stroke="#d4a017" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#faq-islamic-star)" />
        </svg>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full bg-amber-400/20 blur-[90px]" aria-hidden />

        <div className="relative max-w-3xl mx-auto text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 text-xs font-medium px-4 py-1.5 rounded-full backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            Pusat Bantuan UmrahQu
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
            Pertanyaan{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(251,191,36,0.25)]">
              Umum
            </span>
          </h1>
          <p className="text-emerald-100/85 text-sm sm:text-base max-w-xl mx-auto leading-relaxed text-balance">
            Temukan jawaban atas pertanyaan yang sering ditanyakan
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 -mt-8">
        {/* Search bar glassmorphism */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-white/40 rounded-2xl blur-sm" aria-hidden />
          <div className="relative flex items-center bg-white rounded-2xl shadow-[0_16px_40px_-12px_rgba(6,78,59,0.25)] ring-1 ring-emerald-100/60 border border-white/60">
            <span className="w-11 h-11 flex items-center justify-center ml-1.5 my-1.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shrink-0">
              <Search className="w-5 h-5 text-emerald-600" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pertanyaan..."
              className="flex-1 min-w-0 bg-transparent pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/25"
                  : "bg-white border border-slate-200 text-muted-foreground hover:text-emerald-700 hover:border-emerald-300 hover:shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-muted-foreground">Tidak ada pertanyaan ditemukan</p>
              <button
                onClick={() => { setSearch(""); setCategory("Semua") }}
                className="mt-3 px-5 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5"
              >
                Atur Ulang Filter
              </button>
            </div>
          ) : (
            filtered.map((faq) => (
              <div key={faq.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-emerald-100/50 hover:border-emerald-200 transition-all duration-300">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 shrink-0 border border-emerald-100">{faq.category}</span>
                    <span className="font-medium text-sm text-slate-800 group-hover:text-emerald-700 transition-colors">{faq.question}</span>
                  </div>
                  <span className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full transition-all duration-300 ${openId === faq.id ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rotate-180" : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"}`}>
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>
                {openId === faq.id && (
                  <div
                    className="px-5 pb-5 pl-[4.5rem] text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
