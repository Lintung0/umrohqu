import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const ALLOWED_BUCKETS = ["ppiu", "nib", "logo"]
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bucket = formData.get("bucket") as string | null
    const path = formData.get("path") as string | null

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: "File, bucket, dan path wajib diisi" }, { status: 400 })
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: "Bucket tidak valid" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 })
    }

    const admin = createAdminClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: "Gagal upload: " + uploadError.message }, { status: 500 })
    }

    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
