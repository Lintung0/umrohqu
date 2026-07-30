"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Mail, Lock, User, Phone, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/auth/logo"
import { PasswordInput } from "@/components/auth/password-input"
import { PrimaryButton } from "@/components/auth/primary-button"

export default function RegisterTravelPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    travel_name: "",
    travel_phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register-travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Gagal mendaftar")
        return
      }
      setSuccess(true)
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">Pendaftaran Berhasil!</h1>
          <p className="text-muted-foreground">
            Travel Anda sedang menunggu verifikasi admin. Kami akan mengirimkan notifikasi ke email Anda setelah terverifikasi.
          </p>
          <p className="text-muted-foreground text-sm">
            Sementara itu, Anda sudah bisa login menggunakan akun yang baru dibuat.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
          >
            Login Sekarang
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo />
          <h1 className="text-2xl font-bold mt-6">Daftar Travel</h1>
          <p className="text-muted-foreground mt-2">
            Daftarkan travel umroh Anda di platform kami
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nama Travel *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={form.travel_name}
                onChange={(e) => set("travel_name")(e.target.value)}
                placeholder="Contoh: Al-Haramain Travel"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nomor Telepon Travel
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                value={form.travel_phone}
                onChange={(e) => set("travel_phone")(e.target.value)}
                placeholder="Contoh: 021-12345678"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-3">Data admin travel:</p>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nama Lengkap *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="Nama admin travel"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  placeholder="admin@travel.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="mt-4">
              <PasswordInput
                label="Kata Sandi *"
                value={form.password}
                onChange={(v) => set("password")(v)}
              />
            </div>
          </div>

          <PrimaryButton type="submit" loading={loading}>
            {loading ? "Mendaftarkan..." : "Daftar Travel"}
          </PrimaryButton>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
              Masuk
            </Link>
          </p>

          <div className="text-center">
            <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3 h-3 inline mr-1" />
              Daftar sebagai jamaah
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
