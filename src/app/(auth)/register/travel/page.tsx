"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import {
  Building2, Mail, User, Phone, MapPin, FileText, Shield,
  AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Loader2, Globe
} from "lucide-react"
import { Logo } from "@/components/auth/logo"
import AuthInputField from "@/components/auth/input-field"
import { PasswordInput } from "@/components/auth/password-input"
import { PhoneInput } from "@/components/auth/phone-input"
import { FileUpload } from "@/components/auth/file-upload"

type Step = 1 | 2 | 3 | 4

interface Form {
  // Step 1: Profil Publik
  travel_name: string
  slug: string
  description: string
  logo_url: string
  city: string
  travel_phone: string
  // Step 2: Legalitas
  ppiu_number: string
  sk_ppiu_doc_url: string
  nib: string
  nib_doc_url: string
  npwp: string
  akreditasi_ppiu: string
  // Step 3: Akun Admin
  name: string
  email: string
  admin_phone: string
  password: string
  confirm_password: string
  // Step 4: Alamat
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

const STEPS: { label: string; icon: typeof Building2 }[] = [
  { label: "Profil", icon: Building2 },
  { label: "Legalitas", icon: Shield },
  { label: "Akun", icon: User },
  { label: "Alamat", icon: MapPin },
]

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

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, i) => {
        const num = (i + 1) as Step
        const done = num < current
        const active = num === current
        return (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors
                  ${done ? "bg-emerald-600 text-white" : active ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600" : "bg-gray-100 text-gray-400"}
                `}
              >
                {done ? <CheckCircle size={18} /> : num}
              </div>
              <span className={`text-[11px] font-medium hidden sm:block ${active ? "text-emerald-700" : done ? "text-emerald-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-2 mb-5 sm:mb-0 ${done ? "bg-emerald-600" : "bg-gray-200"}`} />
            )}
          </div>
        )
      })}
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
      if (k === "travel_name") {
        next.slug = slugify(v)
      }
      return next
    })
    setErrors((e) => ({ ...e, [k]: "" }))
  }

  const validateStep = (s: Step): boolean => {
    const schemas = { 1: STEP1_SCHEMA, 2: STEP2_SCHEMA, 3: STEP3_SCHEMA, 4: STEP4_SCHEMA }
    const schema = schemas[s]
    const result = schema.safeParse(form)
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

  if (success) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-[26px] font-bold text-auth-foreground">Pendaftaran Berhasil!</h1>
        <p className="text-[16px] text-auth-muted-foreground leading-relaxed max-w-sm mx-auto">
          Travel Anda sedang menunggu verifikasi admin. Kami akan mengirimkan notifikasi ke email Anda setelah terverifikasi.
        </p>
        <p className="text-[14px] text-auth-muted-foreground">
          Sementara itu, Anda sudah bisa login menggunakan akun yang baru dibuat.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
        >
          Login Sekarang
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-7">
        <Logo />
      </div>

      <div className="mb-6">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          Daftar Travel
        </h1>
        <p className="mt-2 text-[16px] leading-relaxed text-auth-muted-foreground">
          Daftarkan travel umroh Anda di platform kami
        </p>
      </div>

      <StepIndicator current={step} />

      {serverError && (
        <div className="mb-4 flex items-start gap-2 rounded-[14px] border border-red-200 bg-red-50 p-3 text-[14px] text-red-600">
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
              Subdomain (URL Travel)
            </label>
            <div
              className="flex min-h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] border-auth-border bg-gray-50"
            >
              <div className="flex items-center pl-3.5 text-auth-muted-foreground">
                <Globe size={18} />
              </div>
              <input
                type="text"
                value={form.slug || slugify(form.travel_name)}
                disabled
                className="flex-1 border-none bg-transparent px-3 py-3.5 text-[15px] text-auth-foreground outline-none placeholder:text-auth-muted-foreground/60 cursor-not-allowed opacity-60"
              />
              <div className="flex shrink-0 items-center border-l-[1.5px] border-auth-border bg-auth-bg px-3 py-3.5">
                <span className="text-[14px] font-medium text-auth-muted-foreground">.umrahqu.id</span>
              </div>
            </div>
            <p className="text-[12px] text-auth-muted-foreground">
              URL travel Anda: <span className="font-medium text-auth-foreground">{form.slug || "nama-travel"}.umrahqu.id</span>
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
              Deskripsi Travel
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Ceritakan tentang travel Anda..."
              rows={3}
              className="rounded-[14px] border-[1.5px] border-auth-border bg-auth-input-bg px-4 py-3 text-[15px] text-auth-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-muted-foreground/60 focus:border-auth-primary focus:shadow-[0_0_0_3px_rgba(42,125,79,0.13)]"
            />
          </div>
          <FileUpload
            label="Logo Travel"
            accept="image"
            bucket="logo"
            value={form.logo_url}
            onUpload={set("logo_url")}
            description="Format: JPG, PNG, WebP"
          />
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
            <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
              Akreditasi PPIU
            </label>
            <input
              type="date"
              value={form.akreditasi_ppiu}
              onChange={(e) => set("akreditasi_ppiu")(e.target.value)}
              className="rounded-[14px] border-[1.5px] border-auth-border bg-auth-input-bg px-4 py-3 text-[15px] text-auth-foreground outline-none transition-[border-color,box-shadow] focus:border-auth-primary focus:shadow-[0_0_0_3px_rgba(42,125,79,0.13)]"
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
            <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.full_address}
              onChange={(e) => { set("full_address")(e.target.value); setErrors((p) => ({ ...p, full_address: "" })) }}
              placeholder="Jl. Contoh No. 123, RT 01/RW 02..."
              rows={3}
              className={`rounded-[14px] border-[1.5px] bg-auth-input-bg px-4 py-3 text-[15px] text-auth-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-muted-foreground/60 ${
                errors.full_address
                  ? "border-red-500 bg-red-50"
                  : "border-auth-border focus:border-auth-primary focus:shadow-[0_0_0_3px_rgba(42,125,79,0.13)]"
              }`}
            />
            {errors.full_address && (
              <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-auth-error">
                <AlertCircle size={14} />
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

          {/* Review Ringkasan */}
          <div className="mt-2 rounded-[14px] border border-auth-border bg-auth-bg p-4">
            <h3 className="text-[15px] font-bold text-auth-foreground mb-3">Ringkasan Data</h3>
            <div className="space-y-2 text-[13px]">
              <Row label="Travel" value={form.travel_name} />
              <Row label="Subdomain" value={`${form.slug || "-"}.umrahqu.id`} />
              <Row label="PPIU" value={form.ppiu_number || "-"} />
              <Row label="NIB" value={form.nib || "-"} />
              <Row label="Admin" value={form.name} />
              <Row label="Email" value={form.email} />
              <Row label="Telepon Admin" value={`+62 ${form.admin_phone}`} />
              <Row label="Alamat" value={form.full_address || "-"} />
              <Row label="Provinsi" value={form.province || "-"} />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-auth-border bg-white px-5 text-[15px] font-semibold text-auth-secondary-foreground transition-colors hover:bg-auth-bg"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[14px] border-none bg-emerald-600 px-5 text-[15px] font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-700"
          >
            Selanjutnya
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[14px] border-none bg-emerald-600 px-5 text-[15px] font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Mendaftarkan..." : "Daftar Travel"}
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-[14px] text-auth-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-bold text-auth-primary no-underline">
          Masuk
        </Link>
      </p>
      <p className="mt-2 text-center text-[13px] text-auth-muted-foreground">
        <Link href="/register" className="font-semibold text-auth-primary no-underline">
          <ArrowLeft size={12} className="inline mr-1" />
          Daftar sebagai jamaah
        </Link>
      </p>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-auth-muted-foreground">{label}</span>
      <span className="font-medium text-auth-foreground text-right">{value}</span>
    </div>
  )
}
