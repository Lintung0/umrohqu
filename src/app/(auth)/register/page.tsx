"use client"

import { useState } from "react"
import Link from "next/link"
import { User, Mail, AlertCircle } from "lucide-react"
import { PasswordInput } from "@/components/auth/password-input"
import { PrimaryButton } from "@/components/auth/primary-button"
import { Divider } from "@/components/auth/divider"
import AuthInputField from "@/components/auth/input-field"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n"
import { z } from "zod"

type RegisterErrors = {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

export default function RegisterPage() {
  const { t } = useTranslation()

  const registerSchema = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t.auth.name_required)
        .min(3, t.auth.name_min.replace("{{min}}", "3")),
      email: z.string().email(t.auth.email_invalid),
      password: z
        .string()
        .min(1, t.auth.password_required)
        .min(8, t.auth.password_min.replace("{{min}}", "8")),
      confirm: z.string().min(1, t.auth.confirm_required),
    })
    .refine((data) => data.password === data.confirm, {
      message: t.auth.password_mismatch,
      path: ["confirm"],
    })

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
      const { error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: { full_name: form.name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.toLowerCase().includes("already")) {
          setAuthError(t.auth.email_invalid)
        } else {
          setAuthError(error.message)
        }
        return
      }

      window.location.href = `/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`
    } catch {
      setAuthError(t.auth.email_invalid)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          {t.auth.register_title}
        </h1>
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
        <AuthInputField
          label={t.auth.full_name}
          value={form.name}
          onChange={set("name")}
          placeholder={t.auth.name_placeholder}
          error={errors.name}
          autoComplete="name"
          icon={User}
        />

        <AuthInputField
          label={t.auth.email}
          value={form.email}
          onChange={set("email")}
          placeholder={t.auth.email_placeholder}
          error={errors.email}
          autoComplete="email"
          icon={Mail}
        />

        <PasswordInput
          label={t.auth.password}
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordInput
          label={t.auth.confirm_password}
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <div className="mt-0.5">
          <PrimaryButton type="submit" loading={loading}>
            {loading ? t.auth.registering : t.auth.register_button}
          </PrimaryButton>
        </div>

        <Divider label={t.common.or} />

        <p className="m-0 text-center text-[14px] text-auth-muted-foreground">
          {t.auth.email_required}{" "}
          <Link href="/terms" className="font-semibold text-auth-primary no-underline">
            {t.footer.terms}
          </Link>{" "}
          dan{" "}
          <Link href="/privacy" className="font-semibold text-auth-primary no-underline">
            {t.footer.privacy}
          </Link>
        </p>
      </form>

      <p className="mb-0 mt-6 text-center text-[15px] text-auth-muted-foreground">
        {t.auth.have_account}{" "}
        <Link href="/login" className="text-[15px] font-bold text-auth-primary no-underline">
          {t.auth.login_link}
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
