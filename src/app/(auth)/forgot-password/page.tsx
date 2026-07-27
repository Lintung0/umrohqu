"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Lock, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { PrimaryButton } from "@/components/auth/primary-button"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Alamat email wajib diisi.")
    .email("Format email tidak valid."),
})

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  const validate = () => {
    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return false
    }
    setError("")
    return true
  }

  const handleSend = async () => {
    if (!validate()) return
    setError("")
    setLoading(true)

    try {
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (sendError) {
        setError(sendError.message)
        return
      }
      setSent(true)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengirim tautan reset.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-[14.5px] font-semibold text-auth-muted-foreground no-underline"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      <div className="mb-9">
        <div className="mb-5 flex size-14 items-center justify-center rounded-[16px] bg-auth-primary-light">
          <Lock size={26} className="text-auth-primary" />
        </div>
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          Lupa Kata Sandi?
        </h1>
        <p className="m-0 mt-2.5 text-[16px] leading-relaxed text-auth-muted-foreground">
          {sent
            ? "Tautan pengaturan ulang kata sandi telah dikirim. Silakan periksa kotak masuk email Anda."
            : "Masukkan alamat email yang terdaftar, dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda."}
        </p>
      </div>

      {sent ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-[14px] border border-auth-primary/20 bg-auth-primary-light p-4">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-auth-primary" />
            <div>
              <p className="m-0 text-[15px] font-semibold text-auth-secondary-foreground">
                Email Terkirim
              </p>
              <p className="m-0 mt-1 text-[14px] leading-relaxed text-auth-muted-foreground">
                Tautan dikirim ke{" "}
                <strong className="text-auth-secondary-foreground">{email}</strong>
              </p>
            </div>
          </div>
          <Link href="/login">
            <PrimaryButton>
              Kembali ke Halaman Masuk
            </PrimaryButton>
          </Link>
          <button
            type="button"
            onClick={() => { setSent(false); setEmail(""); setError("") }}
            className="w-full cursor-pointer border-none bg-transparent text-center text-[14.5px] font-medium text-auth-muted-foreground"
          >
            Kirim ulang email
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
              Alamat Email
            </label>
            <div
              className="flex min-h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] transition-[border-color,box-shadow] duration-150"
              style={{
                borderColor: error ? "#DC2626" : "#DDE8E2",
                background: error ? "#FEF2F2" : "#FAFFFE",
              }}
            >
              <div className="flex items-center pl-3.5 text-auth-muted-foreground">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                autoComplete="email"
                inputMode="email"
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

          <PrimaryButton type="submit" loading={loading}>
            {loading ? "Mengirim..." : "Kirim Tautan Reset"}
          </PrimaryButton>
        </form>
      )}
    </AuthLayout>
  )
}
