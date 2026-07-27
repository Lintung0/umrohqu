"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Mail, CheckCircle2 } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { PrimaryButton } from "@/components/auth/primary-button"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-[20px] bg-auth-primary-light">
          <Mail size={34} className="text-auth-primary" />
        </div>

        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          Cek Email Anda
        </h1>
        <p className="mx-auto mb-8 mt-3 max-w-[320px] text-[16px] leading-relaxed text-auth-muted-foreground">
          Kami telah mengirimkan tautan verifikasi ke email Anda. Silakan klik tautan tersebut untuk mengaktifkan akun.
        </p>

        <div className="mb-8 flex w-full items-start gap-3 rounded-[14px] border border-auth-primary/20 bg-auth-primary-light p-4 text-left">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-auth-primary" />
          <div>
            <p className="m-0 text-[15px] font-semibold text-auth-secondary-foreground">
              Email Terkirim
            </p>
            <p className="m-0 mt-1 text-[14px] leading-relaxed text-auth-muted-foreground">
              {email
                ? `Tautan verifikasi dikirim ke ${email}`
                : "Silakan periksa kotak masuk email Anda."}
            </p>
          </div>
        </div>

        <Link href="/login" className="w-full">
          <PrimaryButton>
            Kembali ke Halaman Masuk
          </PrimaryButton>
        </Link>

        <p className="mb-0 mt-4 text-[14px] text-auth-muted-foreground">
          Tidak menerima email?{" "}
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-0 text-[14px] font-semibold text-auth-primary"
            onClick={async () => {
              if (email) {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                await supabase.auth.resend({
                  type: "signup",
                  email,
                })
              }
            }}
          >
            Kirim ulang
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
