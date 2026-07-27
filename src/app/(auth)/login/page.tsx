"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Logo } from "@/components/auth/logo"
import { PhoneInput } from "@/components/auth/phone-input"
import { PasswordInput } from "@/components/auth/password-input"
import { PrimaryButton } from "@/components/auth/primary-button"
import { GoogleButton } from "@/components/auth/google-button"
import { Divider } from "@/components/auth/divider"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Nomor telepon wajib diisi.")
    .min(9, "Nomor telepon tidak valid."),
  password: z
    .string()
    .min(1, "Kata sandi wajib diisi.")
    .min(6, "Kata sandi minimal 6 karakter."),
})

type LoginErrors = { phone?: string; password?: string }

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<LoginErrors>({})
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  const supabase = createClient()

  const validate = () => {
    const result = loginSchema.safeParse({ phone, password })
    if (!result.success) {
      const fieldErrors: LoginErrors = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginErrors] = err.message
        }
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
      const email = `${phone}@phone.umrohq.id`
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setAuthError(error.message)
        return
      }
      router.push("/dashboard")
    } catch (err: any) {
      setAuthError(err.message || "Terjadi kesalahan saat masuk.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setAuthError(error.message)
    } catch (err: any) {
      setAuthError(err.message || "Terjadi kesalahan saat masuk dengan Google.")
    }
  }

  return (
    <AuthLayout>
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
          {authError === "Invalid login credentials"
            ? "Nomor telepon atau kata sandi salah."
            : authError}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); handleLogin() }}
        className="flex flex-col gap-[18px]"
      >
        <PhoneInput value={phone} onChange={setPhone} error={errors.phone} />
        <PasswordInput
          label="Kata Sandi"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="-mt-1.5 text-right">
          <Link
            href="/forgot-password"
            className="text-[14.5px] font-semibold text-auth-primary no-underline"
          >
            Lupa Kata Sandi?
          </Link>
        </div>

        <PrimaryButton type="submit" loading={loading}>
          {loading ? "Masuk..." : "Masuk"}
        </PrimaryButton>

        <Divider label="atau" />

        <GoogleButton onClick={handleGoogleLogin} />
      </form>

      <p className="mb-0 mt-7 text-center text-[15px] text-auth-muted-foreground">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="text-[15px] font-bold text-auth-primary no-underline"
        >
          Daftar Sekarang
        </Link>
      </p>
    </AuthLayout>
  )
}
