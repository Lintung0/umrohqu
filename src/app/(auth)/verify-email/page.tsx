"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { Mail } from "lucide-react"
import { PrimaryButton } from "@/components/auth/primary-button"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email")
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/login")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-[20px] bg-auth-primary-light">
        <Mail size={34} className="text-auth-primary" />
      </div>

      <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
        Cek Email Anda
      </h1>
      <p className="mx-auto mb-2 mt-3 max-w-[340px] text-[16px] leading-relaxed text-auth-muted-foreground">
        {email ? (
          <>Kami telah mengirim tautan verifikasi ke <strong>{email}</strong></>
        ) : (
          "Kami telah mengirim tautan verifikasi ke email Anda."
        )}
      </p>
      <p className="mx-auto mb-8 max-w-[340px] text-[14px] leading-relaxed text-auth-muted-foreground">
        Klik tautan tersebut untuk mengaktifkan akun Anda. Setelah itu Anda bisa login.
      </p>

      <p className="mb-4 text-[14px] text-auth-muted-foreground">
        Dialihkan ke halaman login dalam {countdown} detik...
      </p>

      <Link href="/login" className="w-full">
        <PrimaryButton>Ke Halaman Login</PrimaryButton>
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
