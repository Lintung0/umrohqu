"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { PrimaryButton } from "@/components/auth/primary-button"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-[20px] bg-auth-primary-light">
        <CheckCircle2 size={34} className="text-auth-primary" />
      </div>

      <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
        Akun Berhasil Dibuat
      </h1>
      <p className="mx-auto mb-8 mt-3 max-w-[320px] text-[16px] leading-relaxed text-auth-muted-foreground">
        {email ? `Email ${email} telah terdaftar. Silakan login untuk melanjutkan.` : "Silakan login untuk melanjutkan."}
      </p>

      <Link href="/login" className="w-full">
        <PrimaryButton>Kembali ke Halaman Masuk</PrimaryButton>
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
