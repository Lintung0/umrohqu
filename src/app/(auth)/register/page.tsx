"use client"

import { useState } from "react"
import Link from "next/link"
import { User, Mail, AlertCircle } from "lucide-react"
import { Logo } from "@/components/auth/logo"
import { PasswordInput } from "@/components/auth/password-input"
import { PrimaryButton } from "@/components/auth/primary-button"
import { Divider } from "@/components/auth/divider"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nama lengkap wajib diisi.")
      .min(3, "Nama minimal 3 karakter."),
    email: z.string().email("Email tidak valid"),
    password: z
      .string()
      .min(1, "Kata sandi wajib diisi.")
      .min(8, "Kata sandi minimal 8 karakter."),
    confirm: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Kata sandi tidak cocok.",
    path: ["confirm"],
  })

type RegisterErrors = {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" })
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  const supabase = createClient()

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: RegisterErrors = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RegisterErrors] = err.message
        }
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleRegister = async () => {
    if (!validate()) return
    setAuthError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAuthError(data.error || "Terjadi kesalahan saat pendaftaran.")
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })

      if (signInError) {
        setAuthError("Akun berhasil dibuat, namun gagal masuk otomatis. Silakan login.")
        return
      }

      window.location.href = "/"
    } catch {
      setAuthError("Terjadi kesalahan jaringan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-7">
        <Logo />
      </div>

      <div className="mb-7">
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          Buat Akun Baru
        </h1>
        <p className="m-0 mt-2 text-[16px] leading-relaxed text-auth-muted-foreground">
          Bergabung dan mulai rencanakan perjalanan Umrah Anda
        </p>
      </div>

      {authError && (
        <div className="mb-4 rounded-[14px] border border-auth-error/30 bg-auth-error-light p-3 text-[14px] text-auth-error">
          {authError}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); handleRegister() }}
        className="flex flex-col gap-4"
      >
        <InputField
          label="Nama Lengkap"
          value={form.name}
          onChange={set("name")}
          placeholder="Masukkan nama lengkap Anda"
          error={errors.name}
          autoComplete="name"
          icon={User}
        />

        <InputField
          label="Email"
          value={form.email}
          onChange={set("email")}
          placeholder="contoh@email.com"
          error={errors.email}
          autoComplete="email"
          icon={Mail}
        />

        <PasswordInput
          label="Kata Sandi"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordInput
          label="Konfirmasi Kata Sandi"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <div className="mt-0.5">
          <PrimaryButton type="submit" loading={loading}>
            {loading ? "Mendaftarkan..." : "Buat Akun"}
          </PrimaryButton>
        </div>

        <Divider label="atau" />

        <p className="m-0 text-center text-[14px] text-auth-muted-foreground">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link href="/terms" className="font-semibold text-auth-primary no-underline">
            Syarat & Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/privacy" className="font-semibold text-auth-primary no-underline">
            Kebijakan Privasi
          </Link>
        </p>
      </form>

      <p className="mb-0 mt-6 text-center text-[15px] text-auth-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-[15px] font-bold text-auth-primary no-underline">
          Masuk
        </Link>
      </p>
    </>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  icon: Icon = Mail,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  autoComplete?: string
  icon?: React.ComponentType<{ size: number }>
  type?: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
        {label}
      </label>
      <div
        className="flex min-h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] transition-[border-color,box-shadow] duration-150"
        style={{
          borderColor: error ? "#DC2626" : focused ? "#2A7D4F" : "#DDE8E2",
          background: error ? "#FEF2F2" : "#FAFFFE",
          boxShadow:
            focused && !error
              ? "0 0 0 3px rgba(42,125,79,0.13)"
              : error && focused
              ? "0 0 0 3px rgba(220,38,38,0.09)"
              : "none",
        }}
      >
        <div className="flex items-center pl-3.5" style={{ color: focused ? "#2A7D4F" : "#5C7268" }}>
          <Icon size={18} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 border-none bg-transparent px-3 py-3.5 text-[16px] text-auth-foreground outline-none placeholder:text-auth-muted-foreground/60"
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-auth-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  )
}