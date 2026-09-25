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
    answer: "UmrahQu adalah platform pencarian dan perbandingan paket umrah terpercaya di Indonesia. Kami membantu jamaah menemukan paket umrah terbaik dari travel-travel terverifikasi, serta membantu travel mengelola bisnis mereka secara digital."
  },
  {
    id: "2",
    category: "Travel",
    question: "Bagaimana cara mendaftar sebagai travel di UmrahQu?",
    answer: 'Travel dapat mendaftar langsung melalui halaman <a href="/register/travel" class="text-emerald-dark hover:underline font-medium">Daftar Travel</a>. Isi data travel dan admin, kemudian tim kami akan memverifikasi dalam 1-3 hari kerja. Setelah diverifikasi, travel dapat membayar setup fee untuk mengaktifkan subdomain, website, dan dashboard travel.'
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
    answer: "Setelah aktif, travel dapat mengisi saldo dompet melalui fitur Topup. Saldo ini digunakan untuk membayar service fee platform per transaksi booking. Sistem ini seperti ATM — isi saldo dulu, baru bisa transaksi. Topup dapat dilakukan via Midtrans (virtual account, QRIS, kartu kredit)."
  },
  {
    id: "5",
    category: "Travel",
    question: "Bagaimana cara travel mendapat pesanan?",
    answer: "Setelah paket umrah dipublikasikan, paket akan tampil di halaman pencarian UmrahQu. Jamaah dapat mencari, membandingkan, dan memesan langsung paket travel Anda. Travel akan menerima notifikasi setiap ada pesanan baru melalui dashboard."
  },
  {
    id: "6",
    category: "Jamaah",
    question: "Bagaimana cara memesan paket umrah?",
    answer: 'Cukup cari paket umrah di halaman <a href="/search" class="text-emerald-dark hover:underline font-medium">Pencarian</a>, pilih paket yang diinginkan, lalu klik "Pesan". Isi data diri dan peserta, pilih metode pembayaran, dan selesaikan pembayaran via Midtrans.'
  },
  {
    id: "7",
    category: "Jamaah",
    question: "Metode pembayaran apa saja yang tersedia?",
    answer: "Pembayaran dapat dilakukan melalui Virtual Account (BCA, Mandiri, BRI, BNI), QRIS (GoPay, OVO, DANA, ShopeePay), dan Kartu Kredit. Semua pembayaran diproses melalui Midtrans yang terpercaya."
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
    answer: 'Anda dapat mendaftar sebagai jamaah di halaman <a href="/register" class="text-emerald-dark hover:underline font-medium">Daftar</a>. Cukup isi nama, email, dan password. Jika Anda adalah travel dan ingin mendaftar sebagai mitra, gunakan halaman <a href="/register/travel" class="text-emerald-dark hover:underline font-medium">Daftar Travel</a>.'
  },
  {
    id: "11",
    category: "Akun",
    question: "Saya sudah daftar sebagai jamaah, bisa upgrade jadi travel?",
    answer: 'Bisa! Silakan hubungi tim kami melalui WhatsApp atau daftar ulang di halaman <a href="/register/travel" class="text-emerald-dark hover:underline font-medium">Daftar Travel</a> dengan email yang berbeda. Atau hubungi admin untuk mengubah role akun Anda.'
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
    <div className="min-h-screen bg-ivory-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-emerald-deep text-ivory py-20 px-6">
        {/* Makkah background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-makkah.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-emerald-deep/80" aria-hidden />
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
            <span className="text-gold-light drop-shadow-[0_2px_20px_rgba(251,191,36,0.25)]">
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
          <div className="absolute inset-0 bg-ivory-card/40 rounded-2xl blur-sm" aria-hidden />
          <div className="relative flex items-center bg-ivory-card rounded-2xl shadow-[0_16px_40px_-12px_rgba(6,78,59,0.25)] ring-1 ring-ivory-border border border-ivory-border">
            <span className="w-11 h-11 flex items-center justify-center ml-1.5 my-1.5 rounded-xl bg-ivory shrink-0">
              <Search className="w-5 h-5 text-emerald-dark" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pertanyaan..."
              className="flex-1 min-w-0 bg-transparent pr-4 py-3 text-sm text-ivory-ink placeholder:text-ivory-ink/70 focus:outline-none"
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
                  ? "bg-emerald-dark text-ivory shadow-md shadow-emerald-deep/25"
                  : "bg-ivory-card border border-ivory-border text-ivory-ink/70 hover:text-emerald-dark hover:border-emerald-dark/40 hover:shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-ivory-card rounded-2xl border border-ivory-border p-12 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-ivory flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-emerald-dark" />
              </div>
              <p className="text-ivory-ink/70">Tidak ada pertanyaan ditemukan</p>
              <button
                onClick={() => { setSearch(""); setCategory("Semua") }}
                className="mt-3 px-5 py-2 text-sm font-semibold rounded-full bg-emerald-dark text-ivory shadow-md shadow-emerald-deep/25 transition-all hover:bg-emerald-deep hover:-translate-y-0.5"
              >
                Atur Ulang Filter
              </button>
            </div>
          ) : (
            filtered.map((faq) => (
              <div key={faq.id} className="group bg-ivory-card rounded-2xl border border-ivory-border overflow-hidden shadow-sm hover:shadow-lg hover:shadow-emerald-deep/5 hover:border-gold/50 transition-all duration-300">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-dark/10 text-emerald-dark shrink-0 border border-emerald-dark/20">{faq.category}</span>
                    <span className="font-medium text-sm text-emerald-deep group-hover:text-emerald-dark transition-colors">{faq.question}</span>
                  </div>
                  <span className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full transition-all duration-300 ${openId === faq.id ? "bg-emerald-dark text-ivory rotate-180" : "bg-ivory border border-ivory-border text-ivory-ink/70 group-hover:bg-emerald-dark/10 group-hover:text-emerald-dark"}`}>
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>
                {openId === faq.id && (
                  <div
                    className="px-5 pb-5 pl-[4.5rem] text-sm text-ivory-ink/70 leading-relaxed border-t border-ivory-border pt-4"
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
