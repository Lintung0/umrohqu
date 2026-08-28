"use client"

import { Construction } from "lucide-react"

export default function AdminTicketsPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-border p-10 max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Construction className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold">Modul tidak tersedia</h1>
        <p className="text-muted-foreground text-sm">Fitur tiket sedang tidak tersedia untuk saat ini.</p>
      </div>
    </div>
  )
}
