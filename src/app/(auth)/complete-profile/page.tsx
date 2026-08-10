"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Phone } from "lucide-react"
import { PhoneInput } from "@/components/auth/phone-input"
import { PrimaryButton } from "@/components/auth/primary-button"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"

const completeProfileSchema = z.object({
  phone: z
    .string()
    .min(1, "Nomor telepon wajib diisi.")
    .min(9, "Nomor telepon tidak valid."),
})

export default function CompleteProfilePage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const validate = () => {
    const result = completeProfileSchema.safeParse({ phone })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return false
    }
    setError("")
    return true
  }

  const handleContinue = async () => {
    if (!validate()) return
    setError("")
    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { phone },
      })

      if (updateError) {
        setError(updateError.message)
        return
      }
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan nomor telepon.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-auth-primary/20 bg-auth-primary-light px-3.5 py-1.5">
        <CheckCircle2 size={15} className="text-auth-primary" />
        <span className="text-[13.5px] font-semibold text-auth-primary">
          Akun Google terverifikasi
        </span>
      </div>

      <div className="mb-9">
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          Lengkapi Profil Anda
        </h1>
        <p className="m-0 mt-2.5 text-[16px] leading-relaxed text-auth-muted-foreground">
          Akun Google Anda telah berhasil diverifikasi. Untuk melanjutkan menggunakan UmrahQu, mohon masukkan nomor telepon aktif Anda agar agen perjalanan dapat menghubungi Anda.
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); handleContinue() }}
        className="flex flex-col gap-5"
      >
        <PhoneInput value={phone} onChange={setPhone} error={error} />

        <div className="flex items-start gap-2.5 rounded-[12px] border border-[#F5E6A3] bg-[#FFFBF0] p-3">
          <Phone size={16} className="mt-0.5 shrink-0 text-[#B07D00]" />
          <p className="m-0 text-[13.5px] leading-relaxed text-[#7A5600]">
            Nomor ini akan digunakan agen perjalanan untuk menghubungi Anda terkait paket Umrah.
          </p>
        </div>

        <PrimaryButton type="submit" loading={loading}>
          {loading ? "Menyimpan..." : "Lanjutkan"}
        </PrimaryButton>
      </form>
    </>
  )
}
