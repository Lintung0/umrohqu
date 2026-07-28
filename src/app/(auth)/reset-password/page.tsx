"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { PasswordInput } from "@/components/auth/password-input"
import { PrimaryButton } from "@/components/auth/primary-button"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"

const resetPasswordSchema = z
  .object({
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

type ResetPasswordErrors = { password?: string; confirm?: string }

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<ResetPasswordErrors>({})
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" && !session) {
        setAuthError("Tautan reset tidak valid atau sudah kadaluwarsa.")
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const validate = () => {
    const result = resetPasswordSchema.safeParse({ password, confirm })
    if (!result.success) {
      const fieldErrors: ResetPasswordErrors = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ResetPasswordErrors] = err.message
        }
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleReset = async () => {
    if (!validate()) return
    setAuthError("")
    setLoading(true)

    try {
      const { error } = await supabaseRef.current.auth.updateUser({ password })
      if (error) {
        setAuthError(error.message)
        return
      }
      setSuccess(true)
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: any) {
      setAuthError(err.message || "Terjadi kesalahan saat menyimpan kata sandi baru.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-5 flex size-14 items-center justify-center rounded-[16px] bg-auth-primary-light">
        <Lock size={26} className="text-auth-primary" />
      </div>
      <div className="mb-9">
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          Atur Ulang Kata Sandi
        </h1>
        <p className="m-0 mt-2.5 text-[16px] leading-relaxed text-auth-muted-foreground">
          Masukkan kata sandi baru untuk akun Anda.
        </p>
      </div>
      {success && (
        <div className="mb-4 rounded-[14px] border border-auth-primary/20 bg-auth-primary-light p-4 text-center">
          <p className="m-0 text-[15px] font-semibold text-auth-secondary-foreground">Kata sandi berhasil diubah!</p>
          <p className="m-0 mt-1 text-[14px] text-auth-muted-foreground">Mengarahkan ke halaman masuk...</p>
        </div>
      )}
      {authError && (
        <div className="mb-4 rounded-[14px] border border-auth-error/30 bg-auth-error-light p-3 text-[14px] text-auth-error">
          {authError}
        </div>
      )}
      {!success && (
        <form onSubmit={(e) => { e.preventDefault(); handleReset() }} className="flex flex-col gap-4">
          <PasswordInput label="Kata Sandi Baru" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" />
          <PasswordInput label="Konfirmasi Kata Sandi Baru" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
          <div className="mt-0.5">
            <PrimaryButton type="submit" loading={loading}>
              {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </>
  )
}
