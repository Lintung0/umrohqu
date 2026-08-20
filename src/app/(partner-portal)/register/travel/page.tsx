"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import {
  Building2, Mail, User, MapPin, FileText, Shield,
  AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Loader2, Globe,
  BadgeCheck, ChevronRight
} from "lucide-react"
import Logo from "@/components/logo"
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
const STEP_ICONS = [Building2, Shield, User, MapPin]

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
    <div className="mb-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-5">
        {STEP_LABELS.map((label, i) => {
          const Icon = STEP_ICONS[i]
          const stepNum = i + 1
          const isActive = stepNum === current
          const isDone = stepNum < current
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                ${isDone ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25" : isActive ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-3 ring-emerald-500/20" : "bg-gray-100 text-gray-400"}
              `}>
                {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[11px] font-semibold transition-colors duration-300 hidden sm:block ${isActive ? "text-emerald-600" : isDone ? "text-emerald-500" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StepHeader({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
      <div>
        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">
          Langkah {step} dari {STEP_LABELS.length}
        </span>
        <h3 className="text-lg font-extrabold text-gray-900">{STEP_LABELS[step - 1]}</h3>
      </div>
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
        {(() => {
          const Icon = STEP_ICONS[step - 1]
          return <Icon className="w-5 h-5 text-emerald-600" />
        })()}
      </div>
    </div>
  )
}

function InputField({ label, icon: Icon, error, children }: {
  label: string
  icon: React.ElementType
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="group">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 group-focus-within:text-emerald-600 transition-colors">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
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
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const cardRef = useRef<HTMLDivElement>(null)

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
      setDirection("forward")
      setStep((s) => Math.min(s + 1, 4) as Step)
      setServerError("")
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const prevStep = () => {
    setDirection("backward")
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
      <div className="w-full max-w-lg mx-auto text-center py-16 animate-fade-in-up">
        <div className="mx-auto w-24 h-24 bg-emerald-500/15 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20 mb-8">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-extrabold mb-4">Pendaftaran Berhasil!</h1>
        <p className="text-base text-gray-400 leading-relaxed max-w-md mx-auto mb-10">
          Travel Anda sedang menunggu verifikasi admin. Notifikasi akan dikirim ke email Anda.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/25 transition-all hover:shadow-xl hover:shadow-emerald-600/30 active:scale-95"
        >
          Login Sekarang
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">

      {/* Header */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-bold mb-6 backdrop-blur-sm">
          <BadgeCheck className="w-4 h-4 text-emerald-400" />
          Portal Mitra Resmi PPIU Kemenag RI
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Daftarkan Agensi{" "}
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            Travel Anda
          </span>
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed">
          Bergabung dengan 100+ Travel Partner & jangkau puluhan ribu calon jamaah umrah di seluruh Indonesia.
        </p>
      </div>

      {/* Form Card */}
      <div
        ref={cardRef}
        className="bg-white text-gray-900 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100/80 text-left w-full mb-4 animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        <ProgressBar current={step} />

        {serverError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 animate-fade-in-up">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        <StepHeader step={step} />

        {/* Step Content with transitions */}
        <div className="relative overflow-hidden">
          <div
            key={step}
            className={`animate-fade-in-up`}
          >
            {/* Step 1: Profil Agensi */}
            {step === 1 && (
              <div className="space-y-4">
                <InputField label="Nama Travel / Agensi *" icon={Building2} error={errors.travel_name}>
                  <div className="relative flex items-center">
                    <Building2 className="w-4 h-4 absolute left-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={form.travel_name}
                      onChange={(e) => set("travel_name")(e.target.value)}
                      placeholder="Contoh: Al-Haramain Tour & Travel"
                      className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md focus:shadow-emerald-500/5 font-medium transition-all ${
                        errors.travel_name ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </InputField>

                <InputField label="Subdomain (URL Khusus Travel) *" icon={Globe}>
                  <div className="relative flex items-center">
                    <Globe className="w-4 h-4 absolute left-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={displaySlug}
                      disabled
                      className="w-full pl-10 pr-32 py-3.5 bg-gray-100/80 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium cursor-not-allowed"
                    />
                    <span className="absolute right-3 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      .umrahqu.id
                    </span>
                  </div>
                  {displaySlug && (
                    <div className="flex items-center gap-1.5 mt-2 px-3 py-2 bg-emerald-50 rounded-lg">
                      <CheckCircle size={14} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">
                        {displaySlug}.umrahqu.id
                      </span>
                    </div>
                  )}
                </InputField>

                <InputField label="Deskripsi Singkat Agensi" icon={FileText}>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description")(e.target.value)}
                    rows={3}
                    placeholder="Ceritakan sejarah singkat, keunggulan, dan pengalaman travel Anda..."
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all resize-none"
                  />
                </InputField>

                <InputField label="Logo Resmi Travel" icon={Building2}>
                  {form.logo_url ? (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
                      <img src={form.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-cover ring-2 ring-white shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">Logo terupload</p>
                        <a href={form.logo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                          Lihat file
                        </a>
                      </div>
                      <button type="button" onClick={() => set("logo_url")("")} className="text-red-400 hover:text-red-600 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors">
                        &times;
                      </button>
                    </div>
                  ) : (
                    <FileUpload
                      label=""
                      hideLabel
                      accept="image"
                      bucket="logo"
                      value={form.logo_url}
                      onUpload={set("logo_url")}
                      description="PNG, JPG, atau WebP (Maksimal 2MB)"
                    />
                  )}
                </InputField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Kota" icon={MapPin}>
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 absolute left-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => set("city")(e.target.value)}
                        placeholder="Jakarta"
                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                      />
                    </div>
                  </InputField>

                  <InputField label="Nomor Telepon Travel" icon={MapPin}>
                    <PhoneInput value={form.travel_phone} onChange={set("travel_phone")} hideLabel />
                  </InputField>
                </div>
              </div>
            )}

            {/* Step 2: Legalitas */}
            {step === 2 && (
              <div className="space-y-4">
                <InputField label="Nomor Izin PPIU *" icon={Shield} error={errors.ppiu_number}>
                  <div className="relative flex items-center">
                    <Shield className="w-4 h-4 absolute left-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={form.ppiu_number}
                      onChange={(e) => set("ppiu_number")(e.target.value)}
                      placeholder="Contoh: U.1234/IV.1.1/PMU.00/2024"
                      className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md focus:shadow-emerald-500/5 font-medium transition-all ${
                        errors.ppiu_number ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </InputField>

                <FileUpload
                  label="File SK PPIU"
                  accept="document-or-image"
                  bucket="ppiu"
                  value={form.sk_ppiu_doc_url}
                  onUpload={set("sk_ppiu_doc_url")}
                  onError={(e) => setErrors((prev) => ({ ...prev, sk_ppiu_doc_url: e }))}
                  error={errors.sk_ppiu_doc_url}
                  required
                  description="Upload surat keputusan PPIU dalam format PDF atau gambar"
                />

                <InputField label="NIB (Nomor Induk Berusaha) *" icon={FileText} error={errors.nib}>
                  <div className="relative flex items-center">
                    <FileText className="w-4 h-4 absolute left-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={form.nib}
                      onChange={(e) => set("nib")(e.target.value)}
                      placeholder="Contoh: 1234567890123"
                      className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md focus:shadow-emerald-500/5 font-medium transition-all ${
                        errors.nib ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </InputField>

                <FileUpload
                  label="File Dokumen NIB"
                  accept="document-or-image"
                  bucket="nib"
                  value={form.nib_doc_url}
                  onUpload={set("nib_doc_url")}
                  onError={(e) => setErrors((prev) => ({ ...prev, nib_doc_url: e }))}
                  error={errors.nib_doc_url}
                  required
                  description="Upload dokumen NIB dalam format PDF atau gambar"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="NPWP Badan Usaha" icon={FileText}>
                    <div className="relative flex items-center">
                      <FileText className="w-4 h-4 absolute left-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={form.npwp}
                        onChange={(e) => set("npwp")(e.target.value)}
                        placeholder="12.345.678.9-012.000"
                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                      />
                    </div>
                  </InputField>

                  <InputField label="Akreditasi PPIU" icon={Shield}>
                    <input
                      type="date"
                      value={form.akreditasi_ppiu}
                      onChange={(e) => set("akreditasi_ppiu")(e.target.value)}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                    />
                  </InputField>
                </div>
              </div>
            )}

            {/* Step 3: Akun Admin */}
            {step === 3 && (
              <div className="space-y-4">
                <InputField label="Nama Lengkap Admin *" icon={User} error={errors.name}>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 absolute left-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name")(e.target.value)}
                      placeholder="Nama admin travel"
                      className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md focus:shadow-emerald-500/5 font-medium transition-all ${
                        errors.name ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </InputField>

                <InputField label="Email *" icon={Mail} error={errors.email}>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3.5 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email")(e.target.value)}
                      placeholder="admin@travel.com"
                      className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md focus:shadow-emerald-500/5 font-medium transition-all ${
                        errors.email ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </InputField>

                <InputField label="Nomor WhatsApp Admin *" icon={Mail} error={errors.admin_phone}>
                  <PhoneInput value={form.admin_phone} onChange={set("admin_phone")} hideLabel error={errors.admin_phone} />
                </InputField>

                <InputField label="Kata Sandi *" icon={Shield} error={errors.password}>
                  <PasswordInput label="" hideLabel value={form.password} onChange={set("password")} error={errors.password} />
                </InputField>

                <InputField label="Konfirmasi Kata Sandi *" icon={Shield} error={errors.confirm_password}>
                  <PasswordInput label="" hideLabel value={form.confirm_password} onChange={set("confirm_password")} error={errors.confirm_password} />
                </InputField>
              </div>
            )}

            {/* Step 4: Alamat & Review */}
            {step === 4 && (
              <div className="space-y-4">
                <InputField label="Alamat Lengkap *" icon={MapPin} error={errors.full_address}>
                  <textarea
                    value={form.full_address}
                    onChange={(e) => { set("full_address")(e.target.value); setErrors((p) => ({ ...p, full_address: "" })) }}
                    rows={3}
                    placeholder="Jl. Contoh No. 123, RT 01/RW 02..."
                    className={`w-full p-3.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md focus:shadow-emerald-500/5 font-medium transition-all resize-none ${
                      errors.full_address ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-emerald-500"
                    }`}
                  />
                </InputField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Provinsi *" icon={MapPin} error={errors.province}>
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 absolute left-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={form.province}
                        onChange={(e) => set("province")(e.target.value)}
                        placeholder="DKI Jakarta"
                        className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md focus:shadow-emerald-500/5 font-medium transition-all ${
                          errors.province ? "border-red-400" : "border-gray-200 focus:border-emerald-500"
                        }`}
                      />
                    </div>
                  </InputField>

                  <InputField label="Kota / Kabupaten" icon={MapPin}>
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 absolute left-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => set("city")(e.target.value)}
                        placeholder="Jakarta Selatan"
                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                      />
                    </div>
                  </InputField>
                </div>

                <InputField label="Kode Pos" icon={MapPin}>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 absolute left-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={form.postal_code}
                      onChange={(e) => set("postal_code")(e.target.value)}
                      placeholder="12345"
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                    />
                  </div>
                </InputField>

                {/* Review Summary */}
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <CheckCircle size={13} className="text-emerald-600" />
                    </div>
                    Ringkasan Data
                  </h3>
                  <div className="space-y-2 text-[13px]">
                    <ReviewRow label="Travel" value={form.travel_name} />
                    <ReviewRow label="Subdomain" value={`${displaySlug}.umrahqu.id`} highlight />
                    <ReviewRow label="PPIU" value={form.ppiu_number || "-"} />
                    <ReviewRow label="NIB" value={form.nib || "-"} />
                    <ReviewRow label="Admin" value={form.name} />
                    <ReviewRow label="Email" value={form.email} />
                    <ReviewRow label="Telepon" value={`+62 ${form.admin_phone}`} />
                    <div className="border-t border-emerald-200/50 my-3" />
                    <ReviewRow label="Alamat" value={form.full_address || "-"} />
                    <ReviewRow label="Provinsi" value={form.province || "-"} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-all flex items-center gap-1.5 hover:gap-2.5 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Kembali
            </button>
          ) : (
            <Link className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1" href="/">
              <ArrowLeft className="w-3.5 h-3.5" />
              Batal
            </Link>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-[0.97] text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/25 transition-all flex items-center gap-2"
            >
              Lanjut
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-[0.97] text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Mendaftarkan..." : "Daftar Sekarang"}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Footer links */}
      <div className="mt-6 text-center space-y-1.5">
        <p className="text-sm text-gray-500">
          Sudah punya akun mitra?{" "}
          <Link className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold transition-colors" href="/login">
            Masuk di sini
          </Link>
        </p>
        <p className="text-xs text-gray-600">
          <Link href="/register" className="text-gray-500 hover:text-emerald-400 transition-colors no-underline">
            <ArrowLeft size={11} className="inline mr-1" />
            Daftar sebagai jamaah
          </Link>
        </p>
      </div>
    </div>
  )
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className={`font-semibold text-right ${highlight ? "text-emerald-600" : "text-gray-800"}`}>{value}</span>
    </div>
  )
}
