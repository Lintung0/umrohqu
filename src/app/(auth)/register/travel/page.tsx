"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import {
  Building2, Mail, User, MapPin, FileText, Shield,
  AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Loader2, Globe,
  UploadCloud, BadgeCheck, ChevronRight
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

const STEP_LABELS = ["Profil", "Legalitas", "Akun", "Alamat"]

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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEP_LABELS.map((label, i) => {
          const num = (i + 1) as Step
          const done = num < current
          const active = num === current
          return (
            <div key={num} className="flex items-center gap-1.5">
              <div
                className={`
                  flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300
                  ${done ? "bg-emerald-500 text-white" : active ? "bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500" : "bg-white/5 text-white/30"}
                `}
              >
                {done ? <CheckCircle size={14} /> : num}
              </div>
              <span className={`text-xs font-medium hidden sm:block transition-colors ${active ? "text-white" : done ? "text-emerald-400" : "text-white/30"}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
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
      <div className="text-center space-y-6 py-8">
        <div className="mx-auto w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Pendaftaran Berhasil!</h1>
        <p className="text-base text-white/60 leading-relaxed max-w-md mx-auto">
          Travel Anda sedang menunggu verifikasi admin. Kami akan mengirimkan notifikasi ke email Anda setelah terverifikasi.
        </p>
        <p className="text-sm text-white/40">
          Sementara itu, Anda sudah bisa login menggunakan akun yang baru dibuat.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/25 transition-all"
        >
          Login Sekarang
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* B2B Value Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-5">
          <Logo type="icon" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <BadgeCheck size={13} />
            Portal Mitra Resmi PPIU Kemenag
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-emerald-300 bg-clip-text text-transparent">
            Daftarkan Agensi Travel Anda
          </span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-white/50 max-w-lg mx-auto leading-relaxed">
          Bergabung dengan 100+ Travel Partner & Jangkau Puluhan Ribu Calon Jamaah di Seluruh Indonesia
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white text-gray-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-gray-100">
        <ProgressBar current={step} />

        {serverError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Step 1: Profil Publik */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <AuthInputField
              label="Nama Travel"
              value={form.travel_name}
              onChange={set("travel_name")}
              placeholder="Contoh: Al-Haramain Travel"
              error={errors.travel_name}
              icon={Building2}
            />

            {/* Interactive Subdomain */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[15px] font-semibold tracking-tight text-gray-700">
                Subdomain (URL Travel)
              </label>
              <div className="flex min-h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] border-gray-200 bg-gray-50">
                <div className="flex items-center pl-3.5 text-gray-400">
                  <Globe size={18} />
                </div>
                <input
                  type="text"
                  value={displaySlug}
                  disabled
                  className="flex-1 border-none bg-transparent px-3 py-3.5 text-[15px] text-gray-900 outline-none cursor-not-allowed opacity-60"
                />
                <div className="flex shrink-0 items-center border-l-[1.5px] border-gray-200 bg-gray-100 px-3 py-3.5">
                  <span className="text-[14px] font-medium text-gray-400">.umrahqu.id</span>
                </div>
              </div>
              {displaySlug && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Globe size={12} className="text-gray-400" />
                  <span className="text-gray-400">URL Travel Anda:</span>
                  <span className="font-semibold text-gray-700">{displaySlug}.umrahqu.id</span>
                  <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                    <CheckCircle size={10} />
                    Tersedia
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[15px] font-semibold tracking-tight text-gray-700">
                Deskripsi Travel
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                placeholder="Ceritakan tentang travel Anda..."
                rows={3}
                className="rounded-[14px] border-[1.5px] border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900 outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
              />
            </div>

            {/* Modern Logo Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[15px] font-semibold tracking-tight text-gray-700">
                Logo Travel
              </label>
              {form.logo_url ? (
                <div className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-emerald-200 bg-emerald-50/50 px-4 py-3">
                  <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Logo terupload</p>
                    <a href={form.logo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                      Lihat file
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => set("logo_url")("")}
                    className="text-red-400 hover:text-red-600 text-xs font-medium"
                  >
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
                  description="JPG, PNG (Maks 2MB)"
                />
              )}
            </div>

            <AuthInputField
              label="Kota"
              value={form.city}
              onChange={set("city")}
              placeholder="Contoh: Jakarta"
              icon={MapPin}
            />
            <PhoneInput
              value={form.travel_phone}
              onChange={set("travel_phone")}
            />
          </div>
        )}

        {/* Step 2: Legalitas */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <AuthInputField
              label="Nomor Izin PPIU"
              value={form.ppiu_number}
              onChange={set("ppiu_number")}
              placeholder="Contoh: U.1234/IV.1.1/PMU.00/2024"
              error={errors.ppiu_number}
              icon={Shield}
            />
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
            <AuthInputField
              label="NIB (Nomor Induk Berusaha)"
              value={form.nib}
              onChange={set("nib")}
              placeholder="Contoh: 1234567890123"
              error={errors.nib}
              icon={FileText}
            />
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
            <AuthInputField
              label="NPWP Badan Usaha"
              value={form.npwp}
              onChange={set("npwp")}
              placeholder="Contoh: 12.345.678.9-012.000"
              icon={FileText}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[15px] font-semibold tracking-tight text-gray-700">
                Akreditasi PPIU
              </label>
              <input
                type="date"
                value={form.akreditasi_ppiu}
                onChange={(e) => set("akreditasi_ppiu")(e.target.value)}
                className="rounded-[14px] border-[1.5px] border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900 outline-none transition-[border-color,box-shadow] focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
              />
            </div>
          </div>
        )}

        {/* Step 3: Akun Admin */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <AuthInputField
              label="Nama Lengkap"
              value={form.name}
              onChange={set("name")}
              placeholder="Nama admin travel"
              error={errors.name}
              icon={User}
            />
            <AuthInputField
              label="Email"
              value={form.email}
              onChange={set("email")}
              placeholder="admin@travel.com"
              error={errors.email}
              icon={Mail}
              type="email"
            />
            <PhoneInput
              value={form.admin_phone}
              onChange={set("admin_phone")}
              error={errors.admin_phone}
            />
            <PasswordInput
              label="Kata Sandi"
              value={form.password}
              onChange={set("password")}
              error={errors.password}
            />
            <PasswordInput
              label="Konfirmasi Kata Sandi"
              value={form.confirm_password}
              onChange={set("confirm_password")}
              error={errors.confirm_password}
            />
          </div>
        )}

        {/* Step 4: Alamat & Review */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[15px] font-semibold tracking-tight text-gray-700">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.full_address}
                onChange={(e) => { set("full_address")(e.target.value); setErrors((p) => ({ ...p, full_address: "" })) }}
                placeholder="Jl. Contoh No. 123, RT 01/RW 02..."
                rows={3}
                className={`rounded-[14px] border-[1.5px] bg-gray-50 px-4 py-3 text-[15px] text-gray-900 outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 ${
                  errors.full_address
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
                }`}
              />
              {errors.full_address && (
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-red-500">
                  <AlertCircle size={13} />
                  {errors.full_address}
                </div>
              )}
            </div>
            <AuthInputField
              label="Provinsi"
              value={form.province}
              onChange={set("province")}
              placeholder="Contoh: DKI Jakarta"
              error={errors.province}
              icon={MapPin}
            />
            <AuthInputField
              label="Kota / Kabupaten"
              value={form.city}
              onChange={set("city")}
              placeholder="Contoh: Jakarta Selatan"
              icon={MapPin}
            />
            <AuthInputField
              label="Kode Pos"
              value={form.postal_code}
              onChange={set("postal_code")}
              placeholder="Contoh: 12345"
              icon={MapPin}
            />

            {/* Review Summary */}
            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-5">
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
                <ReviewRow label="Telepon Admin" value={`+62 ${form.admin_phone}`} />
                <ReviewRow label="Alamat" value={form.full_address || "-"} />
                <ReviewRow label="Provinsi" value={form.province || "-"} />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex h-[50px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Kembali
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
            >
              Selanjutnya
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Sudah punya akun mitra?{" "}
          <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700 no-underline">
            Masuk di sini
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-gray-400">
          <Link href="/register" className="text-gray-500 hover:text-emerald-600 no-underline">
            <ArrowLeft size={11} className="inline mr-1" />
            Daftar sebagai jamaah
          </Link>
        </p>
      </div>
    </>
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
