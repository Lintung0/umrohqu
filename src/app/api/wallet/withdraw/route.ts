import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { amount, bankName, accountNumber, accountName } = await req.json()
    if (!amount || amount <= 0) return NextResponse.json({ error: "Jumlah penarikan tidak valid" }, { status: 400 })

    // Check user wallet
    const { data: wallet, error: wErr } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", user.id)
      .single()

    if (wErr || !wallet) return NextResponse.json({ error: "Dompet tidak ditemukan" }, { status: 404 })

    const balance = Number(wallet.balance)
    if (balance < amount) return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 })

    const balanceAfter = balance - amount

    // Update wallet balance
    const { error: updateErr } = await supabase
      .from("wallets")
      .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
      .eq("id", wallet.id)

    if (updateErr) return NextResponse.json({ error: "Gagal memotong saldo" }, { status: 500 })

    // Insert transaction
    const { error: txErr } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        type: "withdrawal",
        amount: -amount,
        balance_before: balance,
        balance_after: balanceAfter,
        status: "pending",
        description: `Penarikan dana ke ${bankName} a.n ${accountName} (${accountNumber})`,
      })

    if (txErr) return NextResponse.json({ error: "Gagal mencatat transaksi" }, { status: 500 })

    return NextResponse.json({ success: true, balance_after: balanceAfter })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan" }, { status: 500 })
  }
}
