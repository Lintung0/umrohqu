"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function BookingSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const supabase = createClient()
  const bookingId = params.id as string

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying")
  const [packageName, setPackageName] = useState("")

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10

    async function verify() {
      try {
        const res = await fetch("/api/booking/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        })
        const data = await res.json()

        if (data.status && data.status !== "pending_payment") {
          setStatus("success")
          loadBookingInfo()
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(verify, 1500)
        } else {
          setStatus("success")
          loadBookingInfo()
        }
      } catch {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(verify, 1500)
        } else {
          setStatus("success")
          loadBookingInfo()
        }
      }
    }

    async function loadBookingInfo() {
      const { data } = await supabase
        .from("bookings")
        .select("package:packages(name)")
        .eq("id", bookingId)
        .single()
      if (data?.package) {
        setPackageName((data.package as any).name || "")
      }
    }

    verify()
  }, [bookingId])

  return (
    <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-border p-8 sm:p-10 max-w-md w-full text-center space-y-6">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t.booking.verifying_payment}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {t.booking.verifying_desc}
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t.booking.payment_success}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {t.booking.payment_success_desc}
              </p>
              {packageName && (
                <p className="text-sm font-medium mt-1">{packageName}</p>
              )}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs text-emerald-700">
                {t.booking.payment_processing_desc}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push(`/dashboard/bookings/${bookingId}`)}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                {t.booking.view_booking}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push("/dashboard/bookings")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {t.booking.view_all_bookings}
              </button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t.booking.payment_submitted}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {t.booking.payment_submitted_desc}
              </p>
            </div>

            <button
              onClick={() => router.push(`/dashboard/bookings/${bookingId}`)}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              {t.booking.view_booking}
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </main>
  )
}
