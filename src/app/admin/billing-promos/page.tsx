"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BillingPromosRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/promos")
  }, [router])
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Mengalihkan ke Promo & Voucher...</p>
      </div>
    </div>
  )
}
