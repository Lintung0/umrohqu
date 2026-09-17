"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, AlertTriangle } from "lucide-react"
import { formatRupiah } from "@/lib/constants"
import { getTravelTenantId } from "@/lib/get-travel-tenant"

interface Deposit {
  balance: number
  minimum_balance: number
  status: string
  updated_at: string | null
}

interface Mutation {
  id: string
  amount: number
  type: string
  description: string | null
  balance_before: number
  balance_after: number
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  topup: "Deposit",
  credit: "Kredit",
  debit: "Debit",
  refund: "Refund",
  service_fee: "Biaya Layanan",
  setup_fee: "Biaya Setup",
  withdrawal: "Penarikan",
}

export default function TravelWalletPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [deposit, setDeposit] = useState<Deposit | null>(null)
  const [mutations, setMutations] = useState<Mutation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (!user) { setLoading(false); return }

        const tId = await getTravelTenantId(supabase, user.id)
        if (!tId) { setLoading(false); return }

        const [depositRes, mutationRes] = await Promise.all([
          supabase
            .from("travel_deposits")
            .select("balance, minimum_balance, status, updated_at")
            .eq("travel_id", tId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("deposit_mutations")
            .select("id, amount, type, description, balance_before, balance_after, created_at, deposit:travel_deposits(travel_id)")
            .eq("deposit.travel_id", tId)
            .order("created_at", { ascending: false })
            .limit(50),
        ])

        if (depositRes.error) {
          console.error("Wallet load error:", depositRes.error)
        }
        if (depositRes.data) setDeposit(depositRes.data)

        if (mutationRes.error) {
          console.error("Mutations load error:", mutationRes.error)
        }
        const rows: any[] = mutationRes.data || []
        setMutations(rows.filter((m) => m.deposit).map((m) => ({ ...m })))
      } catch (e) {
        setError("Terjadi kesalahan saat memuat data saldo.")
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-white border border-border rounded-2xl p-10 text-center text-muted-foreground">
          Silakan login untuk melihat saldo deposit.
        </div>
      </div>
    )
  }

  const negativeTypes = ["debit", "withdrawal", "service_fee", "setup_fee"]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Saldo Deposit</h1>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
            <Wallet className="w-3.5 h-3.5" /> Saldo Saat Ini
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
            {formatRupiah(deposit?.balance ?? 0)}
          </p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-2">Saldo Minimum</p>
          <p className="text-2xl sm:text-3xl font-bold">
            {formatRupiah(deposit?.minimum_balance ?? 0)}
          </p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-2">Status Deposit</p>
          <p className="text-2xl sm:text-3xl font-bold capitalize text-slate-800">
            {deposit?.status || "Belum ada"}
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
          <h2 className="font-semibold">Riwayat Mutasi</h2>
        </div>
        {mutations.length === 0 ? (
          <div className="px-6 py-14 text-center text-muted-foreground">
            <Wallet className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Belum ada mutasi deposit. Saldo akan tampil setelah admin melakukan top-up.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {mutations.map((m) => {
              const isNegative = negativeTypes.includes(m.type)
              return (
                <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isNegative ? "bg-red-50" : "bg-emerald-50"}`}>
                    {isNegative
                      ? <TrendingDown className="w-4 h-4 text-red-500" />
                      : <TrendingUp className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.description || TYPE_LABEL[m.type] || m.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {m.balance_after != null && ` · Saldo ${formatRupiah(m.balance_after)}`}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${isNegative ? "text-red-600" : "text-emerald-700"}`}>
                    {isNegative ? "-" : "+"}{formatRupiah(Math.abs(Number(m.amount) || 0))}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}