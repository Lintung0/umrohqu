"use client"

import { Construction } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ParticipantsDisabledPage() {
  const router = useRouter()
  return (
    <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-2xl p-12 text-center max-w-md w-full">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <Construction className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold mb-1">Modul tidak tersedia</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Data peserta tidak tersedia pada skema baru. Data jamaah kini dikelola langsung melalui proses pemesanan.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="w-full">Kembali ke Dashboard</Button>
      </div>
    </main>
  )
}
