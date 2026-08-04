"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Lock, CheckCircle2, AlertCircle, Smartphone, KeyRound } from "lucide-react"
import { PhoneInput } from "@/components/auth/phone-input"
import { PrimaryButton } from "@/components/auth/primary-button"
import { normalizePhone } from "@/lib/utils/phone"

const STEP_PHONE = "phone"
const STEP_OTP = "otp"
const STEP_DONE = "done"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(STEP_PHONE)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const validatePhone = () => {
    if (!phone.trim() || phone.length < 9) {
      setError("Nomor telepon tidak valid.")
      return false
    }
    setError("")
    return true
  }

  const validateOtp = () => {
    if (code.length !== 6) {
      setError("Kode OTP harus 6 digit.")
      return false
    }
    setError("")
    return true
  }

  const validatePassword = () => {
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.")
      return false
    }
    if (password !== confirm) {
      setError("Kata sandi tidak cocok.")
      return false
    }
    setError("")
    return true
  }

  const handleSendOtp = async () => {
    if (!validatePhone()) return
    setError("")
    setLoading(true)

    try {
      const normalizedPhone = normalizePhone(phone)
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Gagal mengirim OTP.")
        return
      }
      setStep(STEP_OTP)
    } catch {
      setError("Terjadi kesalahan jaringan.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!validateOtp() || !validatePassword()) return
    setError("")
    setLoading(true)

    try {
      const normalizedPhone = normalizePhone(phone)
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, code, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Gagal mengubah kata sandi.")
        return
      }
      setStep(STEP_DONE)
    } catch {
      setError("Terjadi kesalahan jaringan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
          {step === STEP_PHONE && <Lock size={26} className="text-auth-primary" />}
          {step === STEP_OTP && <Smartphone size={26} className="text-auth-primary" />}
          {step === STEP_DONE && <CheckCircle2 size={26} className="text-auth-primary" />}
        </div>
        <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight text-auth-foreground">
          {step === STEP_PHONE && "Lupa Kata Sandi?"}
          {step === STEP_OTP && "Verifikasi OTP"}
          {step === STEP_DONE && "Berhasil!"}
        </h1>
        <p className="m-0 mt-2.5 text-[16px] leading-relaxed text-auth-muted-foreground">
          {step === STEP_PHONE && "Masukkan nomor telepon yang terdaftar. Kami akan kirim kode OTP via WhatsApp."}
          {step === STEP_OTP && "Masukkan kode OTP 6 digit yang dikirim ke WhatsApp Anda, lalu buat kata sandi baru."}
          {step === STEP_DONE && "Kata sandi Anda telah berhasil diubah. Silakan masuk dengan kata sandi baru."}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-1.5 rounded-[14px] border border-auth-error/30 bg-auth-error-light p-3 text-[13.5px] font-medium text-auth-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {step === STEP_PHONE && (
        <form onSubmit={(e) => { e.preventDefault(); handleSendOtp() }} className="flex flex-col gap-5">
          <PhoneInput value={phone} onChange={setPhone} error={error} />
          <PrimaryButton type="submit" loading={loading}>
            {loading ? "Mengirim..." : "Kirim OTP"}
          </PrimaryButton>
        </form>
      )}

      {step === STEP_OTP && (
        <form onSubmit={(e) => { e.preventDefault(); handleResetPassword() }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
              Kode OTP
            </label>
            <div className="flex h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] border-[#DDE8E2] bg-[#FAFFFE]">
              <div className="flex items-center pl-3.5 text-[#5C7268]">
                <KeyRound size={18} />
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="flex-1 border-none bg-transparent px-3 py-3.5 text-[18px] text-auth-foreground outline-none placeholder:text-auth-muted-foreground/60 tracking-[0.3em]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
              Kata Sandi Baru
            </label>
            <div className="flex h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] border-[#DDE8E2] bg-[#FAFFFE]">
              <div className="flex items-center pl-3.5 text-[#5C7268]">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                className="flex-1 border-none bg-transparent px-3 py-3.5 text-[16px] text-auth-foreground outline-none placeholder:text-auth-muted-foreground/60"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="flex h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] border-[#DDE8E2] bg-[#FAFFFE]">
              <div className="flex items-center pl-3.5 text-[#5C7268]">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Masukkan ulang kata sandi baru"
                autoComplete="new-password"
                className="flex-1 border-none bg-transparent px-3 py-3.5 text-[16px] text-auth-foreground outline-none placeholder:text-auth-muted-foreground/60"
              />
            </div>
          </div>

          <div className="mt-0.5">
            <PrimaryButton type="submit" loading={loading}>
              {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
            </PrimaryButton>
          </div>

          <button
            type="button"
            onClick={() => { setStep(STEP_PHONE); setCode(""); setPassword(""); setConfirm(""); setError("") }}
            className="w-full cursor-pointer border-none bg-transparent text-center text-[14.5px] font-medium text-auth-muted-foreground"
          >
            Kirim ulang OTP
          </button>
        </form>
      )}

      {step === STEP_DONE && (
        <Link href="/login">
          <PrimaryButton>Kembali ke Halaman Masuk</PrimaryButton>
        </Link>
      )}
    </>
  )
}
