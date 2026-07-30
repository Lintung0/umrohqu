"use client"

import { useState } from "react"
import Link from "next/link"
import { User, Mail, AlertCircle } from "lucide-react"
import { Logo } from "@/components/auth/logo"
import { PasswordInput } from "@/components/auth/password-input"
import { PrimaryButton } from "@/components/auth/primary-button"
import { Divider } from "@/components/auth/divider"
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
        <Logo />
      </div>

      <div className="mb-7">
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          {t.auth.register_title}
        </h1>
        <p className="m-0 mt-2 text-[16px] leading-relaxed text-auth-muted-foreground">
          {t.auth.register_subtitle}
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
          label={t.auth.full_name}
          value={form.name}
          onChange={set("name")}
          placeholder={t.auth.name_placeholder}
          error={errors.name}
          autoComplete="name"
          icon={User}
        />

        <InputField
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
