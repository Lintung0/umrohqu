import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

function buildPackageContext(packages: any[]) {
  return packages.map((p, i) => `
Paket ${i + 1}: "${p.name}" (ID: ${p.id})
- Travel: ${p.travel_name || "-"}
- Harga: Rp ${(p.price || 0).toLocaleString("id-ID")} / orang
- Harga Asli (sebelum diskon): ${p.original_price ? "Rp " + p.original_price.toLocaleString("id-ID") : "-"}
- Tipe: ${p.type || "-"}
- Durasi: ${p.duration_days || 0} hari
- Bulan Keberangkatan: ${p.departure_month || "-"} ${p.departure_year || ""}
- Maskapai: ${p.airline || "-"}
- Hotel Makkah: ${p.hotel_makkah || "-"} (${p.hotel_makkah_stars || 0} bintang)
- Hotel Madinah: ${p.hotel_madinah || "-"} (${p.hotel_madinah_stars || 0} bintang)
- Fasilitas: ${(p.facilities || []).join(", ") || "-"}
- Kuota: ${p.quota || 0}
- Sisa Kursi: ${p.available ?? p.quota ?? 0}
- Rating Travel: ${p.travel_rating || "N/A"}
- Jumlah Review: ${p.travel_review_count || 0}
`).join("\n---\n")
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key tidak ditemukan. Tambahkan GEMINI_API_KEY di .env.local" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const { packages, message, history } = await req.json()

    if (!packages || packages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Belum ada paket yang dipilih" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" })

    const systemInstruction = `Kamu adalah asisten AI untuk platform UmrahQu — marketplace paket umrah.

Tugas kamu: membantu user membandingkan dan memilih paket umrah terbaik berdasarkan kebutuhan mereka.

Berikut data paket yang sedang dibandingkan user:

${buildPackageContext(packages)}

Panduan:
- Jawab dalam BAHASA INDONESIA yang ramah dan natural.
- Gunakan data paket di atas untuk memberikan rekomendasi yang akurat.
- Jika user bertanya "mana yang terbaik", analisis berdasarkan harga per hari, rating hotel, fasilitas, maskapai, dan kebutuhan user.
- Sebut nama paket saat merujuk ke paket tertentu.
- Jika ada promo/diskon, sebutkan.
- Berikan alasan yang jelas kenapa suatu paket lebih cocok.
- Jangan mengarang data yang tidak ada di atas.
- Jika ada yang kurang jelas, tanya user untuk detail lebih lanjut.
- Jadilah membantu, jangan terlalu formal — gaya ngobrol natural aja.

Selamat membantu! 🕋`

    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = []

    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: `[KONTEKS PAKET]\n${buildPackageContext(packages)}\n\n[PERTANYAAN USER]\n${message}` }],
    })

    const result = await model.generateContentStream({ contents, systemInstruction: { role: "user", parts: [{ text: systemInstruction }] } })

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(new TextEncoder().encode(text))
            }
          }
        } catch (e) {
          controller.enqueue(new TextEncoder().encode("\n\nMaaf, terjadi kesalahan saat memproses jawaban. Silakan coba lagi."))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error: any) {
    console.error("AI recommend error:", error)
    return new Response(
      JSON.stringify({ error: error?.message || "Gagal memproses permintaan" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
