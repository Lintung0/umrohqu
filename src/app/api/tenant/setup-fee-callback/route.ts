import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Modul setup fee invoice sudah dihapus pada skema baru.
  // Endpoint ini dipertahankan agar callback lama tidak menghasilkan error.
  return NextResponse.json({ received: true })
}
