"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PasswordInput } from "@/components/auth/password-input"
import { PrimaryButton } from "@/components/auth/primary-button"
import { Divider } from "@/components/auth/divider"
import AuthInputField from "@/components/auth/input-field"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n"
import { z } from "zod"
import { Mail, Lock, AlertCircle } from "lucide-react"

type LoginErrors = { email?: string; password?: string }

function LoginForm() {
  const { t } = useTranslation()

  const loginSchema = z.object({
    email: z.string().min(1, t.auth.email_required).email(t.auth.email_invalid),
    password: z.string().min(1, t.auth.password_required).min(6, t.auth.password_min.replace("{{min}}", "6")),
  })

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
      setAuthError(t.auth.auth_error_google)
    }
  }, [searchParams, t.auth.auth_error_google])

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
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      if (!checkRes.ok) {
        const checkData = await checkRes.json()
        setAuthError(checkData.error || t.auth.email_required)
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        if (error.message === "Invalid login credentials") {
          setAuthError(t.auth.password_required)
        } else {
          setAuthError(error.message)
        }
        return
      }
      router.push("/")
    } catch {
      setAuthError(t.auth.password_required)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          {t.auth.login_title}
        </h1>
        <p className="m-0 mt-2 text-[16px] leading-relaxed text-auth-muted-foreground">
          {t.auth.login_subtitle}
        </p>
      </div>

      {authError && (
        <div className="mb-4 rounded-[14px] border border-auth-error/30 bg-auth-error-light p-3 text-[14px] text-auth-error">
          {authError}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="flex flex-col gap-[18px]">
        <AuthInputField
          label={t.auth.email}
          value={email}
          onChange={setEmail}
          placeholder={t.auth.email_placeholder}
          error={errors.email}
          autoComplete="email"
          icon={Mail}
        />

        <PasswordInput
          label={t.auth.password}
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="-mt-1.5 text-right">
          <Link href="/forgot-password" className="text-[14.5px] font-semibold text-auth-primary no-underline">
            {t.auth.forgot_password}
          </Link>
        </div>

        <PrimaryButton type="submit" loading={loading}>
          {loading ? t.auth.logging_in : t.nav.login}
        </PrimaryButton>

        <Divider label={t.common.or} />
      </form>

      <p className="mb-0 mt-7 text-center text-[15px] text-auth-muted-foreground">
        {t.auth.no_account}{" "}
        <Link href="/register" className="text-[15px] font-bold text-auth-primary no-underline">
          {t.auth.register_link}
        </Link>
      </p>
      <p className="mt-2 text-center text-[13px] text-auth-muted-foreground">
        Punya travel?{" "}
        <Link href="/register/travel" className="font-bold text-auth-primary no-underline">
          Daftar sebagai Travel
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
