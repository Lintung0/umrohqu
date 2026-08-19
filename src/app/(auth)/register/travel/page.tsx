"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import {
  Building2, Mail, User, MapPin, FileText, Shield,
  AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Loader2, Globe,
  UploadCloud, BadgeCheck
} from "lucide-react"
import Logo from "@/components/logo"
import AuthInputField from "@/components/auth/input-field"
import { PasswordInput } from "@/components/auth/password-input"
import { PhoneInput } from "@/components/auth/phone-input"
import { FileUpload } from "@/components/auth/file-upload"

type Step = 1 | 2 | 3 | 4

interface Form {
  travel_name: string
  slug: string
  description: string
  logo_url: string
  city: string
  travel_phone: string
  ppiu_number: string
  sk_ppiu_doc_url: string
  nib: string
  nib_doc_url: string
  npwp: string
  akreditasi_ppiu: string
  name: string
  email: string
  admin_phone: string
  password: string
  confirm_password: string
  full_address: string
  province: string
  postal_code: string
}

const INITIAL_FORM: Form = {
  travel_name: "", slug: "", description: "", logo_url: "", city: "", travel_phone: "",
  ppiu_number: "", sk_ppiu_doc_url: "", nib: "", nib_doc_url: "", npwp: "", akreditasi_ppiu: "",
  name: "", email: "", admin_phone: "", password: "", confirm_password: "",
  full_address: "", province: "", postal_code: "",
}

const STEP_LABELS = ["Profil Agensi", "Legalitas", "Akun Admin", "Alamat"]

const STEP1_SCHEMA = z.object({
  travel_name: z.string().min(3, "Nama travel minimal 3 karakter"),
})

const STEP2_SCHEMA = z.object({
  ppiu_number: z.string().min(1, "Nomor Izin PPIU wajib diisi"),
  sk_ppiu_doc_url: z.string().url("File SK PPIU wajib diupload").or(z.literal("")).refine((v) => v !== "", "File SK PPIU wajib diupload"),
  nib: z.string().min(1, "NIB wajib diisi"),
  nib_doc_url: z.string().url("File Dokumen NIB wajib diupload").or(z.literal("")).refine((v) => v !== "", "File Dokumen NIB wajib diupload"),
})

const STEP3_SCHEMA = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  admin_phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Kata sandi tidak cocok",
  path: ["confirm_password"],
})

const STEP4_SCHEMA = z.object({
  full_address: z.string().min(10, "Alamat lengkap wajib diisi"),
  province: z.string().min(1, "Provinsi wajib diisi"),
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function ProgressBar({ current }: { current: Step }) {
  const pct = ((current - 1) / (STEP_LABELS.length - 1)) * 100
  return (
    <div className="mb-8 pb-6 border-b border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Langkah {current} dari {STEP_LABELS.length}
          </span>
          <h3 className="text-lg font-bold text-gray-900">{STEP_LABELS[current - 1]}</h3>
        </div>
        <div className="flex gap-1.5">
          {STEP_LABELS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === current ? "w-8 bg-emerald-600" : i + 1 < current ? "w-2 bg-emerald-400" : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function RegisterTravelPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const [success, setSuccess] = useState(false)

  const set = (k: keyof Form) => (v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (k === "travel_name") next.slug = slugify(v)
      return next
    })
    setErrors((e) => ({ ...e, [k]: "" }))
  }

  const validateStep = (s: Step): boolean => {
    const schemas = { 1: STEP1_SCHEMA, 2: STEP2_SCHEMA, 3: STEP3_SCHEMA, 4: STEP4_SCHEMA }
    const result = schemas[s].safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string
        if (field) fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 4) as Step)
      setServerError("")
    }
  }

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1) as Step)
    setErrors({})
    setServerError("")
  }

  async function handleSubmit() {
    if (!validateStep(4)) return
    setLoading(true)
    setServerError("")
    try {
      const res = await fetch("/api/auth/register-travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || "Gagal mendaftar")
        return
      }
      setSuccess(true)
    } catch {
      setServerError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const displaySlug = form.slug || slugify(form.travel_name)

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 text-white py-12 px-4 flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="relative z-10 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-extrabold">Pendaftaran Berhasil!</h1>
          <p className="text-base text-gray-400 leading-relaxed max-w-md mx-auto">
            Travel Anda sedang menunggu verifikasi admin. Notifikasi akan dikirim ke email Anda.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/25 transition-all"
          >
            Login Sekarang
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">

      {/* Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl mx-auto text-center">

        {/* Header Logo & B2B Badge */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Logo type="icon" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            <span>Portal Mitra Resmi PPIU Kemenag RI</span>
          </div>
        </div>

        {/* Main B2B Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
          Daftarkan Agensi{" "}
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            Travel Anda
          </span>
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Bergabung dengan 100+ Travel Partner & jangkau puluhan ribu calon jamaah umrah di seluruh Indonesia dalam satu platform.
        </p>

        {/* Full Centered Card Form */}
        <div className="bg-white text-gray-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-emerald-100 text-left w-full">

          <ProgressBar current={step} />

          {serverError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Step 1: Profil Agensi */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Nama Travel / Agensi *
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.travel_name}
                    onChange={(e) => set("travel_name")(e.target.value)}
                    placeholder="Contoh: Al-Haramain Tour & Travel"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all ${
                      errors.travel_name ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                    }`}
                  />
                </div>
                {errors.travel_name && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.travel_name}
                  </p>
                )}
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Subdomain (URL Khusus Travel) *
                </label>
                <div className="relative flex items-center">
                  <Globe className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={displaySlug}
                    disabled
                    className="w-full pl-10 pr-28 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-medium cursor-not-allowed opacity-60"
                  />
                  <span className="absolute right-3 text-xs font-bold text-gray-400 bg-gray-200/70 px-2.5 py-1 rounded-md">
                    .umrahqu.id
                  </span>
                </div>
                {displaySlug && (
                  <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> URL Travel Anda: <span className="underline">{displaySlug}.umrahqu.id</span>
                  </p>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Deskripsi Singkat Agensi
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description")(e.target.value)}
                  rows={3}
                  placeholder="Ceritakan sejarah singkat, keunggulan, dan pengalaman travel Anda..."
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all"
                />
              </div>

              {/* Upload Logo */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Logo Resmi Travel
                </label>
                {form.logo_url ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
                    <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Logo terupload</p>
                      <a href={form.logo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                        Lihat file
                      </a>
                    </div>
                    <button type="button" onClick={() => set("logo_url")("")} className="text-red-400 hover:text-red-600 text-xs font-medium">
                      Hapus
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    label=""
                    accept="image"
                    bucket="logo"
                    value={form.logo_url}
                    onUpload={set("logo_url")}
                    description="PNG, JPG, atau WebP (Maksimal 2MB)"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Kota
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set("city")(e.target.value)}
                    placeholder="Contoh: Jakarta"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Nomor Telepon Travel
                </label>
                <PhoneInput value={form.travel_phone} onChange={set("travel_phone")} />
              </div>
            </div>
          )}

          {/* Step 2: Legalitas */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Nomor Izin PPIU *
                </label>
                <div className="relative flex items-center">
                  <Shield className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.ppiu_number}
                    onChange={(e) => set("ppiu_number")(e.target.value)}
                    placeholder="Contoh: U.1234/IV.1.1/PMU.00/2024"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all ${
                      errors.ppiu_number ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                    }`}
                  />
                </div>
                {errors.ppiu_number && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.ppiu_number}
                  </p>
                )}
              </div>

              <FileUpload
                label="File SK PPIU"
                accept="document"
                bucket="ppiu"
                value={form.sk_ppiu_doc_url}
                onUpload={set("sk_ppiu_doc_url")}
                onError={(e) => setErrors((prev) => ({ ...prev, sk_ppiu_doc_url: e }))}
                error={errors.sk_ppiu_doc_url}
                required
                description="Upload surat keputusan PPIU dalam format PDF"
              />

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  NIB (Nomor Induk Berusaha) *
                </label>
                <div className="relative flex items-center">
                  <FileText className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.nib}
                    onChange={(e) => set("nib")(e.target.value)}
                    placeholder="Contoh: 1234567890123"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all ${
                      errors.nib ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                    }`}
                  />
                </div>
                {errors.nib && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.nib}
                  </p>
                )}
              </div>

              <FileUpload
                label="File Dokumen NIB"
                accept="document"
                bucket="nib"
                value={form.nib_doc_url}
                onUpload={set("nib_doc_url")}
                onError={(e) => setErrors((prev) => ({ ...prev, nib_doc_url: e }))}
                error={errors.nib_doc_url}
                required
                description="Upload dokumen NIB dalam format PDF"
              />

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  NPWP Badan Usaha
                </label>
                <div className="relative flex items-center">
                  <FileText className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.npwp}
                    onChange={(e) => set("npwp")(e.target.value)}
                    placeholder="Contoh: 12.345.678.9-012.000"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Akreditasi PPIU
                </label>
                <input
                  type="date"
                  value={form.akreditasi_ppiu}
                  onChange={(e) => set("akreditasi_ppiu")(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 3: Akun Admin */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Nama Lengkap Admin *
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                    placeholder="Nama admin travel"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all ${
                      errors.name ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Email *
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    placeholder="admin@travel.com"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all ${
                      errors.email ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Nomor WhatsApp Admin *
                </label>
                <PhoneInput value={form.admin_phone} onChange={set("admin_phone")} error={errors.admin_phone} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Kata Sandi *
                </label>
                <PasswordInput label="" value={form.password} onChange={set("password")} error={errors.password} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Konfirmasi Kata Sandi *
                </label>
                <PasswordInput label="" value={form.confirm_password} onChange={set("confirm_password")} error={errors.confirm_password} />
              </div>
            </div>
          )}

          {/* Step 4: Alamat & Review */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Alamat Lengkap *
                </label>
                <textarea
                  value={form.full_address}
                  onChange={(e) => { set("full_address")(e.target.value); setErrors((p) => ({ ...p, full_address: "" })) }}
                  rows={3}
                  placeholder="Jl. Contoh No. 123, RT 01/RW 02..."
                  className={`w-full p-3.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all ${
                    errors.full_address ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-emerald-500"
                  }`}
                />
                {errors.full_address && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.full_address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Provinsi *
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) => set("province")(e.target.value)}
                    placeholder="Contoh: DKI Jakarta"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all ${
                      errors.province ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                    }`}
                  />
                </div>
                {errors.province && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.province}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Kota / Kabupaten
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set("city")(e.target.value)}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Kode Pos
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 absolute left-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => set("postal_code")(e.target.value)}
                    placeholder="Contoh: 12345"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Review Summary */}
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  Ringkasan Data
                </h3>
                <div className="space-y-2 text-[13px]">
                  <ReviewRow label="Travel" value={form.travel_name} />
                  <ReviewRow label="Subdomain" value={`${displaySlug}.umrahqu.id`} />
                  <ReviewRow label="PPIU" value={form.ppiu_number || "-"} />
                  <ReviewRow label="NIB" value={form.nib || "-"} />
                  <ReviewRow label="Admin" value={form.name} />
                  <ReviewRow label="Email" value={form.email} />
                  <ReviewRow label="Telepon" value={`+62 ${form.admin_phone}`} />
                  <ReviewRow label="Alamat" value={form.full_address || "-"} />
                  <ReviewRow label="Provinsi" value={form.province || "-"} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
              </button>
            ) : (
              <Link className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors" href="/">
                ← Batal
              </Link>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <span>Lanjut ke {STEP_LABELS[step]}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? "Mendaftarkan..." : "Daftar Sekarang"}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Sudah punya akun mitra?{" "}
          <Link className="text-emerald-400 hover:underline font-semibold" href="/login">
            Masuk di sini
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-gray-600">
          <Link href="/register" className="text-gray-500 hover:text-emerald-400 no-underline">
            <ArrowLeft size={11} className="inline mr-1" />
            Daftar sebagai jamaah
          </Link>
        </p>
      </div>
    </main>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700 text-right">{value}</span>
    </div>
  )
}
