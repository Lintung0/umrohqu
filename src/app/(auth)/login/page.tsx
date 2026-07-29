"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/auth/logo"
import { PasswordInput } from "@/components/auth/password-input"
import { PrimaryButton } from "@/components/auth/primary-button"
import { Divider } from "@/components/auth/divider"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"
import { Mail, Lock, AlertCircle } from "lucide-react"

const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi.").min(6, "Kata sandi minimal 6 karakter."),
})

type LoginErrors = { email?: string; password?: string }

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<LoginErrors>({})
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback_error") {
      setAuthError("Gagal masuk dengan Google. Silakan coba lagi.")
    }
  }, [searchParams])

  const validate = () => {
    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: LoginErrors = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as keyof LoginErrors] = err.message
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleLogin = async () => {
    if (!validate()) return
    setAuthError("")
    setLoading(true)

    try {
      // Cek apakah user ada di database dulu
      const { data: userExists } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle()

      if (!userExists) {
        setAuthError("Akun belum terdaftar. Silakan daftar terlebih dahulu.")
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        if (error.message === "Invalid login credentials") {
          setAuthError("Kata sandi salah.")
        } else {
          setAuthError(error.message)
        }
        return
      }
      router.push("/")
    } catch {
      setAuthError("Terjadi kesalahan saat masuk.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <Logo />
      </div>

      <div className="mb-8">
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          Selamat Datang
        </h1>
        <p className="m-0 mt-2 text-[16px] leading-relaxed text-auth-muted-foreground">
          Masuk untuk melanjutkan perjalanan ibadah Anda
        </p>
      </div>

      {authError && (
        <div className="mb-4 rounded-[14px] border border-auth-error/30 bg-auth-error-light p-3 text-[14px] text-auth-error">
          {authError}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="flex flex-col gap-[18px]">
        <InputField
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="contoh@email.com"
          error={errors.email}
          autoComplete="email"
          icon={Mail}
        />

        <PasswordInput
          label="Kata Sandi"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="-mt-1.5 text-right">
          <Link href="/forgot-password" className="text-[14.5px] font-semibold text-auth-primary no-underline">
            Lupa Kata Sandi?
          </Link>
        </div>

        <PrimaryButton type="submit" loading={loading}>
          {loading ? "Masuk..." : "Masuk"}
        </PrimaryButton>

        <Divider label="atau" />
      </form>

      <p className="mb-0 mt-7 text-center text-[15px] text-auth-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="text-[15px] font-bold text-auth-primary no-underline">
          Daftar Sekarang
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
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  autoComplete?: string
  icon?: React.ComponentType<{ size: number }>
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
          type="email"
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}