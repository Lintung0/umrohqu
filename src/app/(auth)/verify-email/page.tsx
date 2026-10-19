"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react"
import { PrimaryButton } from "@/components/auth/primary-button"
import { useTranslation } from "@/lib/i18n"

function VerifyEmailContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle")
  const [resendMessage, setResendMessage] = useState("")
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return

    setResending(true)
    setResendStatus("idle")
    setResendMessage("")

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResendStatus("error")
        setResendMessage(data.error || "Gagal mengirim ulang email.")
        return
      }

      setResendStatus("success")
      setResendMessage("Tautan konfirmasi baru telah dikirim ke email Anda.")
      setCooldown(60)
    } catch {
      setResendStatus("error")
      setResendMessage("Terjadi kesalahan jaringan. Silakan coba lagi.")
    } finally {
      setResending(false)
    }
  }

  // Detect email webmail provider
  const domain = email.split("@")[1]?.toLowerCase()
  let webmailUrl = ""
  let webmailLabel = ""

  if (domain === "gmail.com" || domain === "googlemail.com") {
    webmailUrl = "https://mail.google.com"
    webmailLabel = "Buka Gmail"
  } else if (domain === "yahoo.com" || domain === "yahoo.co.id") {
    webmailUrl = "https://mail.yahoo.com"
    webmailLabel = "Buka Yahoo Mail"
  } else if (
    domain === "outlook.com" ||
    domain === "hotmail.com" ||
    domain === "live.com"
  ) {
    webmailUrl = "https://outlook.live.com"
    webmailLabel = "Buka Outlook"
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-[20px] bg-auth-primary-light">
        <Mail size={34} className="text-auth-primary" />
      </div>

      <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
        {t.auth.verify_email_title}
      </h1>

      <p className="mx-auto mb-5 mt-3 max-w-[360px] text-[15px] leading-relaxed text-auth-muted-foreground">
        {email ? (
          <>
            Kami telah mengirimkan tautan konfirmasi ke <strong className="text-auth-foreground">{email}</strong>.
            Silakan periksa kotak masuk untuk mengaktifkan akun Anda.
          </>
        ) : (
          t.auth.verify_email_desc
        )}
      </p>

      {/* Helpful Hint Card */}
      <div className="mb-6 w-full max-w-[380px] rounded-[14px] border border-amber-200/60 bg-amber-50/60 p-3.5 text-left text-[13px] leading-relaxed text-amber-900">
        <p className="m-0 font-medium">Tips:</p>
        <p className="m-0 mt-1 text-amber-800/90">
          Jika tidak menemukan email di Kotak Masuk, periksa folder <strong>Spam</strong> atau <strong>Promosi</strong>.
        </p>
      </div>

      {/* Feedback Messages */}
      {resendStatus === "success" && (
        <div className="mb-5 flex w-full max-w-[380px] items-center gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50 p-3 text-left text-[13px] text-emerald-800">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{resendMessage}</span>
        </div>
      )}

      {resendStatus === "error" && (
        <div className="mb-5 flex w-full max-w-[380px] items-center gap-2 rounded-[14px] border border-red-200 bg-red-50 p-3 text-left text-[13px] text-red-800">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{resendMessage}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex w-full max-w-[380px] flex-col gap-3">
        {webmailUrl && (
          <a
            href={webmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-auth-border bg-white text-[15px] font-semibold text-auth-foreground transition-colors hover:bg-slate-50"
          >
            <span>{webmailLabel}</span>
            <ExternalLink size={15} className="text-auth-muted-foreground" />
          </a>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={!email || cooldown > 0 || resending}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-auth-primary/40 bg-auth-primary/5 px-4 text-[14px] font-medium text-auth-primary transition hover:bg-auth-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={15} className={resending ? "animate-spin" : ""} />
          {resending
            ? "Mengirimkan ulang..."
            : cooldown > 0
            ? `Kirim ulang dalam ${cooldown} detik`
            : "Kirim Ulang Email Konfirmasi"}
        </button>

        <div className="mt-2 pt-2">
          <Link href="/login" className="w-full no-underline">
            <PrimaryButton>{t.nav.login}</PrimaryButton>
          </Link>
        </div>
      </div>
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
