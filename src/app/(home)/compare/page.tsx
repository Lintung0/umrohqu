"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { X, Check, Minus, GitCompare, Award, Sparkles, TrendingDown, Star, Bookmark, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import AiChatPanel from "@/components/shared/ai-chat-panel"
import { createClient } from "@/lib/supabase/client"
import { useCompare, MAX_COMPARE } from "@/lib/compare-context"
import type { Package, Tenant } from "@/lib/types"

const AIRLINE_QUALITY: Record<string, number> = {
  "Garuda Indonesia": 5, "Saudi Airlines": 4, "Turkish Airlines": 4,
  "Royal Jordanian": 4, "Batik Air": 3, "Lion Air": 2, "Citilink": 1,
}

const ROW_LABELS = [
  { key: "price", label: "Harga" },
  { key: "type", label: "Tipe Paket" },
  { key: "duration", label: "Durasi" },
  { key: "departure_month", label: "Bulan Berangkat" },
  { key: "airline", label: "Maskapai" },
  { key: "hotel_makkah", label: "Hotel Makkah" },
  { key: "hotel_makkah_stars", label: "Bintang Makkah" },
  { key: "hotel_madinah", label: "Hotel Madinah" },
  { key: "hotel_madinah_stars", label: "Bintang Madinah" },
  { key: "quota", label: "Kuota" },
  { key: "available", label: "Sisa Kursi" },
  { key: "facilities", label: "Fasilitas" },
]

function calcScore(pkg: Package) {
  const pricePerDay = pkg.price / (pkg.duration_days || 1)
  const makkahStars = pkg.hotel_makkah_stars || 0
  const madinahStars = pkg.hotel_madinah_stars || 0
  const avgHotel = (makkahStars + madinahStars) / 2
  const facilitiesCount = (pkg.facilities || []).length
  const airlineScore = AIRLINE_QUALITY[pkg.airline || ""] || 2
  const valueScore = ((avgHotel * 15) + (facilitiesCount * 8) + (airlineScore * 6)) / Math.max(pricePerDay / 1000000, 1)
  return { pricePerDay, avgHotel, facilitiesCount, valueScore }
}

function SmartBadges({ scores, index }: { scores: ReturnType<typeof calcScore>[]; index: number }) {
  const bestValue = scores.indexOf(scores.reduce((a, b) => a.valueScore > b.valueScore ? a : b))
  const cheapest = scores.indexOf(scores.reduce((a, b) => a.pricePerDay < b.pricePerDay ? a : b))
  const bestHotel = scores.indexOf(scores.reduce((a, b) => a.avgHotel > b.avgHotel ? a : b))

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {index === bestValue && (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-1.5 py-0.5 rounded-full">
          <Award className="w-2.5 h-2.5" /> Best Value
        </span>
      )}
      {index === cheapest && (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full">
          <TrendingDown className="w-2.5 h-2.5" /> Termurah
        </span>
      )}
      {index === bestHotel && scores.length > 1 && (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full">
          <Star className="w-2.5 h-2.5" /> Hotel Terbaik
        </span>
      )}
    </div>
  )
}

function renderValue(key: string, pkg: Package, highlight?: "best" | "worst") {
  const hlClass = highlight === "best" ? "ring-2 ring-emerald-400/40 bg-emerald-50/50 rounded-lg p-1.5 -m-1.5" : ""
  switch (key) {
    case "price":
      return (
        <div className={hlClass}>
          {pkg.original_price && (
            <p className="text-xs text-muted-foreground line-through">{formatRupiah(pkg.original_price)}</p>
          )}
          <p className="font-bold text-primary">{formatRupiah(pkg.price)}</p>
          <p className="text-[10px] text-muted-foreground">/ orang</p>
        </div>
      )
    case "hotel_makkah_stars":
      return <span className={hlClass}>{"★".repeat(pkg.hotel_makkah_stars || 0)}</span>
    case "hotel_madinah_stars":
      return <span className={hlClass}>{"★".repeat(pkg.hotel_madinah_stars || 0)}</span>
    case "duration":
      return <span className={hlClass}>{pkg.duration_days} Hari</span>
    case "type":
      return <span className={`capitalize font-medium ${hlClass}`}>{pkg.type}</span>
    case "facilities":
      return (
        <ul className={`space-y-1 ${hlClass}`}>
          {(pkg.facilities || []).map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-xs">
              <Check className="w-3 h-3 text-primary shrink-0" />{f}
            </li>
          ))}
        </ul>
      )
    default:
      const value = pkg[key as keyof Package]
      return <span className={hlClass}>{String(value ?? "-")}</span>
  }
}

function compareRows(pkgs: Package[], key: string, _scores: ReturnType<typeof calcScore>[]): ("best" | "worst" | undefined)[][] {
  return pkgs.map((pkg, i) => {
    const others = pkgs.filter((_, j) => j !== i)
    return others.map((other) => {
      if (key === "price") {
        if (pkg.price < other.price) return "best"
        if (pkg.price > other.price) return "worst"
      }
      if (key === "duration") {
        if ((pkg.duration_days || 0) > (other.duration_days || 0)) return "best"
        if ((pkg.duration_days || 0) < (other.duration_days || 0)) return "worst"
      }
      if (key === "hotel_makkah_stars" || key === "hotel_madinah_stars") {
        const a = pkg[key === "hotel_makkah_stars" ? "hotel_makkah_stars" : "hotel_madinah_stars"] || 0
        const b = other[key === "hotel_makkah_stars" ? "hotel_makkah_stars" : "hotel_madinah_stars"] || 0
        if (a > b) return "best"
        if (a < b) return "worst"
      }
      if (key === "facilities") {
        const a = (pkg.facilities || []).length
        const b = (other.facilities || []).length
        if (a > b) return "best"
        if (a < b) return "worst"
      }
      return undefined
    })
  })
}

function SavedTab({ tenantsMap }: { tenantsMap: Map<string, Tenant> }) {
  const { savedPackages, toggleSave, addToCompare, comparePackages, isFull } = useCompare()
  const [search, setSearch] = useState("")

  const filtered = savedPackages.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {savedPackages.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Belum ada paket tersimpan</h3>
          <p className="text-sm text-muted-foreground mb-6">Klik icon bookmark di kartu paket untuk menyimpan</p>
          <Link href="/search">
            <Button>Cari Paket</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari paket tersimpan..."
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{savedPackages.length} paket</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((pkg) => {
              const travel = tenantsMap.get(pkg.tenant_id)
              const inCompare = comparePackages.some((p) => p.id === pkg.id)
              return (
                <div key={pkg.id} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col">
                  <div className="relative h-28">
                    <Image
                      src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"}
                      alt={pkg.name}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => toggleSave(pkg)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    {travel && (
                      <p className="text-[10px] text-muted-foreground mb-1">{travel.name}</p>
                    )}
                    <Link href={`/package/${pkg.slug}`} className="text-xs font-semibold leading-snug line-clamp-2 mb-2 hover:text-primary transition-colors">{pkg.name}</Link>
                    <div className="mt-auto">
                      <p className="text-sm font-bold text-primary mb-2">{formatRupiah(pkg.price)}</p>
                      <Button
                        size="sm"
                        variant={inCompare ? "default" : "outline"}
                        className="w-full text-xs h-8"
                        disabled={!inCompare && isFull}
                        onClick={() => {
                          if (inCompare) return
                          addToCompare(pkg)
                        }}
                      >
                        {inCompare ? (
                          <><Check className="w-3 h-3 mr-1" /> Sedang dibandingkan</>
                        ) : isFull ? (
                          "Bandingkan penuh"
                        ) : (
                          <><GitCompare className="w-3 h-3 mr-1" /> Bandingkan</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function CompareTab() {
  const { comparePackages, removeFromCompare } = useCompare()

  const scores = useMemo(() => comparePackages.map(calcScore), [comparePackages])

  const rowHighlights = useMemo(() => {
    const highlights: Record<string, ("best" | "worst" | undefined)[][]> = {}
    ROW_LABELS.forEach((row) => {
      const arr = compareRows(comparePackages, row.key, scores)
      if (arr.length === comparePackages.length && arr.every((r) => r.length === comparePackages.length - 1)) {
        const result: ("best" | "worst" | undefined)[] = []
        for (let i = 0; i < comparePackages.length; i++) {
          const allBest = arr[i].every((h) => h === "best")
          const allWorst = arr[i].every((h) => h === "worst")
          result.push(allBest ? "best" : allWorst ? "worst" : undefined)
        }
        highlights[row.key] = [result]
      }
    })
    return highlights
  }, [comparePackages, scores])

  const insightLines = useMemo(() => {
    if (comparePackages.length < 2) return []
    const lines: string[] = []
    const pricePerDay = comparePackages.map((p, i) => ({ i, v: scores[i].pricePerDay })).sort((a, b) => a.v - b.v)
    const cheapestPerDay = pricePerDay[0]
    const mostExpensivePerDay = pricePerDay[pricePerDay.length - 1]
    const diff = mostExpensivePerDay.v - cheapestPerDay.v

    if (diff > 0) {
      const cheapestName = comparePackages[cheapestPerDay.i].name
      const expensiveName = comparePackages[mostExpensivePerDay.i].name
      lines.push(`${cheapestName} lebih hemat Rp ${formatRupiah(Math.round(diff))} per hari dibanding ${expensiveName}.`)
    }

    const bestValue = scores.indexOf(scores.reduce((a, b) => a.valueScore > b.valueScore ? a : b))
    const worstValue = scores.indexOf(scores.reduce((a, b) => a.valueScore < b.valueScore ? a : b))
    if (bestValue !== worstValue) {
      const reasons: string[] = []
      if (scores[bestValue].avgHotel > scores[worstValue].avgHotel) reasons.push("hotel bintang lebih tinggi")
      if (scores[bestValue].facilitiesCount > scores[worstValue].facilitiesCount) reasons.push("fasilitas lebih lengkap")
      if (reasons.length > 0) {
        lines.push(`${comparePackages[bestValue].name} memiliki nilai terbaik karena ${reasons.join(" dan ")}.`)
      }
    }

    return lines
  }, [comparePackages, scores])

  const emptySlots = MAX_COMPARE - comparePackages.length

  if (comparePackages.length === 0) {
    return (
      <div className="text-center py-16">
        <GitCompare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Belum ada paket dipilih</h3>
        <p className="text-sm text-muted-foreground mb-6">Buka tab &quot;Tersimpan&quot; lalu klik &quot;Bandingkan&quot; di paket yang diinginkan</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[640px]">
        {insightLines.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">Smart Comparison</span>
            </div>
            <ul className="space-y-1.5">
              {insightLines.map((line, i) => (
                <li key={i} className="text-xs leading-relaxed text-emerald-700">{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${MAX_COMPARE}, 1fr)` }}>
          <div />
          {comparePackages.map((pkg, i) => (
            <div key={pkg.id} className={`bg-white border-2 rounded-2xl overflow-hidden ${
              scores[i].valueScore === Math.max(...scores.map(s => s.valueScore)) && comparePackages.length > 1
                ? "border-emerald-400 shadow-md shadow-emerald-100"
                : "border-primary/30"
            }`}>
              <div className="relative h-28">
                <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name} fill className="object-cover" />
                <button
                  onClick={() => removeFromCompare(pkg.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {scores[i].valueScore === Math.max(...scores.map(s => s.valueScore)) && comparePackages.length > 1 && (
                  <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Award className="w-3 h-3" /> Pilihan Terbaik
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold leading-snug line-clamp-2">{pkg.name}</p>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Rp {Math.round(scores[i].pricePerDay / 1000)}rb / hari
                </div>
                <SmartBadges scores={scores} index={i} />
              </div>
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={i} className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground min-h-[160px]">
              <Minus className="w-6 h-6" />
              <span className="text-xs font-medium">Slot kosong</span>
            </div>
          ))}
        </div>

        {comparePackages.length > 0 && ROW_LABELS.map((row, idx) => (
          <div
            key={row.key}
            className={`grid gap-4 py-3 ${idx % 2 === 0 ? "bg-muted/30" : ""} rounded-xl px-2`}
            style={{ gridTemplateColumns: `200px repeat(${MAX_COMPARE}, 1fr)` }}
          >
            <div className="text-xs font-semibold text-muted-foreground flex items-center">{row.label}</div>
            {comparePackages.map((pkg, i) => {
              const hl = rowHighlights[row.key]?.[0]?.[i]
              return (
                <div key={pkg.id} className="text-sm">
                  {renderValue(row.key, pkg, hl)}
                </div>
              )
            })}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <Minus className="w-4 h-4 text-border" />
              </div>
            ))}
          </div>
        ))}

        {comparePackages.length > 0 && (
          <div
            className="grid gap-4 mt-4 pt-4 border-t border-border"
            style={{ gridTemplateColumns: `200px repeat(${MAX_COMPARE}, 1fr)` }}
          >
            <div />
            {comparePackages.map((pkg) => (
              <Link key={pkg.id} href={`/package/${pkg.slug}`}>
                <Button className="w-full text-xs h-9">Pilih Paket Ini</Button>
              </Link>
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => <div key={i} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function CompareContent() {
  const [activeTab, setActiveTab] = useState<"saved" | "compare">("saved")
  const [tenantsMap, setTenantsMap] = useState<Map<string, Tenant>>(new Map())
  const [loading, setLoading] = useState(true)
  const { savedCount, compareCount, addToCompare } = useCompare()

  useEffect(() => {
    const supabase = createClient()
    const fetchData = async () => {
      const { data: tnts } = await supabase
        .from("tenants")
        .select("*")
        .is("deleted_at", null)
      if (tnts) {
        const m = new Map<string, Tenant>()
        tnts.forEach((t) => m.set(t.id, t as Tenant))
        setTenantsMap(m)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            Tersimpan & Bandingkan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Simpan paket sebanyak mungkin, bandingkan maksimal {MAX_COMPARE}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "saved" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Tersimpan
            {savedCount > 0 && (
              <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {savedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "compare" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Bandingkan
            {compareCount > 0 && (
              <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {compareCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "saved" ? (
          <SavedTab tenantsMap={tenantsMap} />
        ) : (
          <CompareTab />
        )}
      </div>

      <AiChatPanel packages={[]} />
    </main>
  )
}

export default function ComparePage() {
  return (
    <Suspense>
      <CompareContent />
    </Suspense>
  )
}
