import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const AIRLINE_QUALITY: Record<string, number> = {
  "Garuda Indonesia": 5, "Saudi Airlines": 4, "Turkish Airlines": 4,
  "Royal Jordanian": 4, "Batik Air": 3, "Lion Air": 2, "Citilink": 1,
}

function buildPackageContext(packages: any[]) {
  return packages.map((p, i) => `
Paket ${i + 1}: "${p.name}" (ID: ${p.id})
- Travel: ${p.travel_name || "-"}
- Harga: Rp ${(p.price || 0).toLocaleString("id-ID")} / orang
- Harga Asli (sebelum diskon): ${p.original_price ? "Rp " + p.original_price.toLocaleString("id-ID") : "-"}
- Tipe: ${p.type || "-"}
- Durasi: ${p.duration_nights || 0} hari
- Bulan Keberangkatan: ${p.departure_month || "-"} ${p.departure_year || ""}
- Maskapai: ${p.airline || "-"}
- Hotel Makkah: ${p.hotel_makkah || "-"} (${p.hotel_makkah_stars || 0} bintang)
- Hotel Madinah: ${p.hotel_madinah || "-"} (${p.hotel_madinah_stars || 0} bintang)
- Fasilitas: ${(p.facilities || []).join(", ") || "-"}
- Kuota: ${p.quota || 0}
- Sisa Kursi: ${p.available ?? (p.quota ?? 0) - (p.quota_taken ?? 0)}
`).join("\n---\n")
}

function calcScore(pkg: any) {
  const pricePerDay = pkg.price / (pkg.duration_nights || 1)
  const makkahStars = pkg.hotel_makkah_stars || 0
  const madinahStars = pkg.hotel_madinah_stars || 0
  const avgHotel = (makkahStars + madinahStars) / 2
  const facilitiesCount = (pkg.facilities || []).length
  const airlineScore = AIRLINE_QUALITY[pkg.airline || ""] || 2
  const valueScore = ((avgHotel * 15) + (facilitiesCount * 8) + (airlineScore * 6)) / Math.max(pricePerDay / 1000000, 1)
  return { pricePerDay, avgHotel, facilitiesCount, valueScore }
}

function formatRupiah(num: number) {
  return "Rp " + Math.round(num).toLocaleString("id-ID")
}

function generateFallbackResponse(packages: any[], message: string, history: any[]): string {
  const scores = packages.map(calcScore)
  const msg = message.toLowerCase()

  const bestValue = scores.indexOf(scores.reduce((a, b) => a.valueScore > b.valueScore ? a : b))
  const cheapest = scores.indexOf(scores.reduce((a, b) => a.pricePerDay < b.pricePerDay ? a : b))
  const bestHotel = scores.indexOf(scores.reduce((a, b) => a.avgHotel > b.avgHotel ? a : b))

  const intro = "Saya AI assisten UmrahQu (sedang mode offline). Berdasarkan data paket yang dibandingkan:\n\n"

  const generalSummary = () => {
    let text = intro
    packages.forEach((pkg, i) => {
      text += `📦 **${pkg.name}** — ${formatRupiah(pkg.price)} (${pkg.duration_nights} hari, ≈ ${formatRupiah(Math.round(scores[i].pricePerDay))}/hari)\n`
      text += `   Hotel: ${"⭐".repeat(pkg.hotel_makkah_stars || 0)} Makkah + ${"⭐".repeat(pkg.hotel_madinah_stars || 0)} Madinah\n`
      text += `   Maskapai: ${pkg.airline || "-"} | Fasilitas: ${(pkg.facilities || []).length} item\n\n`
    })

    if (packages.length >= 2) {
      text += `📊 **Rekomendasi:**\n`
      text += `🏆 Nilai terbaik: **${packages[bestValue].name}** (skor: ${scores[bestValue].valueScore.toFixed(1)})\n`
      text += `💰 Termurah per hari: **${packages[cheapest].name}** (${formatRupiah(Math.round(scores[cheapest].pricePerDay))}/hari)\n`
      if (bestHotel !== cheapest || bestHotel !== bestValue) {
        text += `⭐ Hotel terbaik: **${packages[bestHotel].name}** (rata-rata ${scores[bestHotel].avgHotel.toFixed(1)} bintang)\n`
      }
    }
    return text
  }

  if (msg.includes("keluarga") || msg.includes("family") || msg.includes("anak")) {
    const sorted = [...packages].sort((a, b) => (b.quota || 0) - (a.quota || 0))
    const mostQuota = packages.indexOf(sorted[0])
    let text = intro
    text += `Untuk keluarga, saya rekomendasikan:\n\n`
    text += `🥇 **${packages[mostQuota].name}** — kuota ${packages[mostQuota].quota} kursi, cocok untuk rombongan keluarga.\n`
    text += `   Harga: ${formatRupiah(packages[mostQuota].price)}/orang\n`
    text += `   Hotel: ${"⭐".repeat(packages[mostQuota].hotel_makkah_stars || 0)} Makkah + ${"⭐".repeat(packages[mostQuota].hotel_madinah_stars || 0)} Madinah\n`
    text += `   Fasilitas: ${(packages[mostQuota].facilities || []).join(", ") || "-"}\n\n`
    text += `Tips: untuk keluarga, perhatikan fasilitas seperti hotel bintang tinggi dan maskapai bagus agar perjalanan nyaman.`
    return text
  }

  if (msg.includes("hemat") || msg.includes("murah") || msg.includes("budget") || msg.includes("termurah") || msg.includes("makan")) {
    let text = intro
    text += `💰 **Paket termurah:** **${packages[cheapest].name}**\n`
    text += `   Harga: ${formatRupiah(packages[cheapest].price)} (≈ ${formatRupiah(Math.round(scores[cheapest].pricePerDay))}/hari)\n`
    text += `   Durasi: ${packages[cheapest].duration_nights} hari\n`
    text += `   Hotel: ${"⭐".repeat(packages[cheapest].hotel_makkah_stars || 0)} Makkah | ${"⭐".repeat(packages[cheapest].hotel_madinah_stars || 0)} Madinah\n`
    text += `   Maskapai: ${packages[cheapest].airline || "-"}\n\n`
    if (packages.length >= 2) {
      const secondCheapest = packages.filter((_, i) => i !== cheapest).sort((a, b) => a.price - b.price)[0]
      text += `Sebagai alternatif, **${secondCheapest?.name}** hanya ${formatRupiah(secondCheapest?.price || 0)} dengan fasilitas lebih.\n`
    }
    text += `\n💡 Tips: jangan cuma lihat harga total, lihat juga harga per hari untuk perbandingan yang lebih akurat!`
    return text
  }

  if (msg.includes("hotel") || msg.includes("bintang") || msg.includes("mewah") || msg.includes("nyaman")) {
    let text = intro
    text += `⭐ **Hotel terbaik:** **${packages[bestHotel].name}**\n`
    text += `   Hotel Makkah: ${packages[bestHotel].hotel_makkah || "-"} (${packages[bestHotel].hotel_makkah_stars || 0}⭐)\n`
    text += `   Hotel Madinah: ${packages[bestHotel].hotel_madinah || "-"} (${packages[bestHotel].hotel_madinah_stars || 0}⭐)\n`
    text += `   Rata-rata: ${scores[bestHotel].avgHotel.toFixed(1)} bintang\n`
    return text
  }

  if (msg.includes("durasi") || msg.includes("hari") || msg.includes("lama") || msg.includes("cepat")) {
    const byDuration = [...packages].sort((a, b) => (b.duration_nights || 0) - (a.duration_nights || 0))
    let text = intro
    text += `📅 **Paket terlama:** **${byDuration[0].name}** — ${byDuration[0].duration_nights} hari\n`
    text += `📅 **Paket terpendek:** **${byDuration[byDuration.length - 1].name}** — ${byDuration[byDuration.length - 1].duration_nights} hari\n\n`
    byDuration.forEach((p, i) => {
      text += `• ${p.name}: ${p.duration_nights} hari — ${formatRupiah(Math.round(scores[packages.indexOf(p)].pricePerDay))}/hari\n`
    })
    text += `\n💡 Makin lama biasanya lebih hemat per hari, tapi pertimbangkan jadwal libur Anda.`
    return text
  }

  if (msg.includes("recommended") || msg.includes("rekomendasi") || msg.includes("terbaik") || msg.includes("pilihan") || msg.includes("sarankan") || msg.includes("recommend")) {
    let text = intro
    text += `🏆 **Pilihan terbaik:** **${packages[bestValue].name}**\n\n`
    text += `Skor nilai: ${scores[bestValue].valueScore.toFixed(1)} (tertinggi)\n\n`
    text += `Alasan:\n`
    if (scores[bestValue].avgHotel > scores.filter((_, i) => i !== bestValue).reduce((max, s) => Math.max(max, s.avgHotel), 0)) {
      text += `✅ Hotel bintang lebih tinggi (rata-rata ${scores[bestValue].avgHotel.toFixed(1)}⭐)\n`
    }
    if (scores[bestValue].facilitiesCount > scores.filter((_, i) => i !== bestValue).reduce((max, s) => Math.max(max, s.facilitiesCount), 0)) {
      text += `✅ Fasilitas lebih lengkap (${scores[bestValue].facilitiesCount} item)\n`
    }
    const isCheapest = bestValue === cheapest
    if (isCheapest) {
      text += `✅ Harga per hari paling rendah (${formatRupiah(Math.round(scores[bestValue].pricePerDay))}/hari)\n`
    } else {
      text += `✅ Harga bersaing: ${formatRupiah(packages[bestValue].price)} (Rp ${formatRupiah(Math.round(scores[bestValue].pricePerDay))}/hari)\n`
    }
    text += `\n💰 Alternatif lebih hemat: **${packages[cheapest].name}** (${formatRupiah(Math.round(scores[cheapest].pricePerDay))}/hari)`
    return text
  }

  return generalSummary()
}

export async function POST(req: Request) {
  let body: { packages: any[]; message: string; history?: any[] }

  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Format request tidak valid" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const { packages, message, history } = body

  if (!packages || packages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Belum ada paket yang dipilih" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!genAI) {
    const fallback = generateFallbackResponse(packages, message, history || [])
    return new Response(
      JSON.stringify({ fallback: true, content: fallback }),
      { headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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

    const result = await model.generateContentStream({
      contents,
      systemInstruction: { role: "user", parts: [{ text: systemInstruction }] },
    })

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

    const fallback = generateFallbackResponse(packages, message, history || [])
    return new Response(
      JSON.stringify({ fallback: true, content: fallback }),
      { headers: { "Content-Type": "application/json" } }
    )
  }
}
