"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { X, Check, Minus, Scale, Award, Sparkles, TrendingDown, Star, Plus, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { formatRupiah } from "@/lib/utils"
import AiChatPanel from "@/components/shared/ai-chat-panel"
import { createClient } from "@/lib/supabase/client"
import { enrichPackagesWithDetail } from "@/lib/package-detail-fields"
import { useCompare, MAX_COMPARE } from "@/lib/compare-context"
import { PackageStatusBadge } from "@/components/shared/package-status-badge"
import type { Package } from "@/lib/types"

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

function getFacilitiesList(facilities: unknown): string[] {
  if (!facilities) return []
  if (Array.isArray(facilities)) return facilities.map(String)
  if (typeof facilities === "object" && facilities !== null) {
    if (Array.isArray((facilities as any).items)) {
      return (facilities as any).items.map(String)
    }
    const keys = Object.keys(facilities)
    if (keys.length === 0) return []
    return keys.map((k) => {
      const val = (facilities as Record<string, unknown>)[k]
      return typeof val === "boolean" ? k : `${k}: ${String(val)}`
    })
  }
  if (typeof facilities === "string") {
    try {
      const parsed = JSON.parse(facilities)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {}
    return facilities.split(",").map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function calcScore(pkg: Package) {
  const price = Number(pkg.price) || 0
  const duration = Number(pkg.duration_nights) || 1
  const pricePerDay = price / duration
  const makkahStars = Number(pkg.hotel_makkah_stars) || 0
  const madinahStars = Number(pkg.hotel_madinah_stars) || 0
  const avgHotel = (makkahStars + madinahStars) / 2
  const facilitiesCount = getFacilitiesList(pkg.facilities).length
  const airlineScore = AIRLINE_QUALITY[pkg.airline || ""] || 2
  const rawValueScore = ((avgHotel * 15) + (facilitiesCount * 8) + (airlineScore * 6)) / Math.max(pricePerDay / 1000000, 1)
  const valueScore = isNaN(rawValueScore) ? 0 : rawValueScore
  return { pricePerDay, avgHotel, facilitiesCount, valueScore }
}

function SmartBadges({ scores, index }: { scores: ReturnType<typeof calcScore>[]; index: number }) {
  if (scores.length < 2) return null
  const bestValue = scores.indexOf(scores.reduce((a, b) => a.valueScore > b.valueScore ? a : b))
  const cheapest = scores.indexOf(scores.reduce((a, b) => a.pricePerDay < b.pricePerDay ? a : b))
  const bestHotel = scores.indexOf(scores.reduce((a, b) => a.avgHotel > b.avgHotel ? a : b))

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {index === bestValue && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-1.5 py-0.5 rounded-full">
          <Award className="w-2.5 h-2.5" /> Best Value
        </span>
      )}
      {index === cheapest && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full">
          <TrendingDown className="w-2.5 h-2.5" /> Termurah
        </span>
      )}
      {index === bestHotel && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full">
          <Star className="w-2.5 h-2.5" /> Hotel Terbaik
        </span>
      )}
    </div>
  )
}

function MobileCompareSlide({ pkg, index, scores, maxScore, rowHighlights, removeFromCompare }: {
  pkg: Package; index: number; scores: ReturnType<typeof calcScore>[]; maxScore: number;
  rowHighlights: Record<string, ("best" | "worst" | undefined)[][]>;
  removeFromCompare: (id: string) => void;
}) {
  const isBest = scores.length > 1 && scores[index].valueScore === maxScore && maxScore > 0
  const facilities = getFacilitiesList(pkg.facilities)

  return (
    <div className="bg-white border-2 rounded-2xl overflow-hidden shadow-md mx-1">
      <div className="relative h-40">
        {isBest && <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 z-10" />}
        <Image
          src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"}
          alt={pkg.name || "Paket"} fill className="object-cover"
        />
        <button
          onClick={() => removeFromCompare(pkg.id)}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <PackageStatusBadge status={pkg.status} />
          {isBest && (
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md shadow-amber-500/40 flex items-center gap-1">
              <Award className="w-3 h-3" /> Pilihan Terbaik
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold leading-snug line-clamp-2">{pkg.name}</p>
        <div className="text-xs text-muted-foreground mt-1">
          Rp {Math.round(scores[index].pricePerDay / 1000)}rb / hari
        </div>
        <SmartBadges scores={scores} index={index} />
      </div>
      <div className="px-4 pb-2">
        <div className="border-t border-border pt-3 space-y-2.5">
          {ROW_LABELS.map((row, idx) => {
            const hl = rowHighlights[row.key]?.[0]?.[index]
            return (
              <div key={row.key} className={`grid grid-cols-[88px_1fr] gap-2 py-1.5 ${idx % 2 === 0 ? "bg-muted/30 -mx-2 px-2 rounded-lg" : ""}`}>
                <span className="text-[11px] font-semibold text-muted-foreground">{row.label}</span>
                <div className="text-[13px]">
                  {row.key === "facilities" ? (
                    facilities.length > 0
                      ? <div className="flex flex-wrap gap-1">{facilities.map((f, i) => <span key={i} className="inline-flex items-center gap-1 text-[11px]"><Check className="w-2.5 h-2.5 text-primary shrink-0" />{f}</span>)}</div>
                      : <span className="text-muted-foreground">-</span>
                  ) : (
                    renderValue(row.key, pkg, hl)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="px-4 pb-4 pt-2 border-t border-border">
        <Link href={`/package/${pkg.slug}`}>
          <Button className="w-full text-xs h-9 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-600/25">Pilih Paket Ini</Button>
        </Link>
      </div>
    </div>
  )
}

function MobileDotIndicator({ total, api }: { total: number; api: CarouselApi }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap())
    api.on("select", onSelect)
    onSelect()
    return () => { api.off("select", onSelect) }
  }, [api])
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1.5 mt-3">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i} onClick={() => api?.scrollTo(i)}
          className={`rounded-full transition-all duration-200 ${i === selectedIndex ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30"}`}
        />
      ))}
    </div>
  )
}

function renderValue(key: string, pkg: Package, highlight?: "best" | "worst") {
  const hlWrap = (node: React.ReactNode) => {
    if (!highlight) return node
    if (highlight === "best") {
      return (
        <div className="relative rounded-lg bg-emerald-100/70 border border-emerald-400/60 ring-2 ring-emerald-400/40 px-2.5 py-2 mt-1 block">
          <span className="inline-flex items-center gap-1 absolute -top-2 left-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10">
            <Award className="w-2 h-2" /> Terbaik
          </span>
          {node}
        </div>
      )
    }
    return <div className="rounded-lg opacity-70">{node}</div>
  }

  switch (key) {
    case "price":
      return hlWrap(
        <div>
          <p className="font-bold text-primary">{formatRupiah(Number(pkg.price) || 0)}</p>
          <p className="text-[11px] text-muted-foreground">/ orang</p>
        </div>
      )
    case "hotel_makkah_stars":
      return hlWrap(<span className="text-amber-500">{"★".repeat(Math.max(0, Number(pkg.hotel_makkah_stars) || 0))}</span>)
    case "hotel_madinah_stars":
      return hlWrap(<span className="text-amber-500">{"★".repeat(Math.max(0, Number(pkg.hotel_madinah_stars) || 0))}</span>)
    case "duration":
      return hlWrap(<span>{pkg.duration_nights || "-"} Hari</span>)
    case "type":
      return hlWrap(<span className={`capitalize font-medium`}>{pkg.type || "-"}</span>)
    case "facilities": {
      const facList = getFacilitiesList(pkg.facilities)
      if (facList.length === 0) return hlWrap(<span>-</span>)
      return hlWrap(
        <ul className="space-y-1">
          {facList.map((f, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs">
              <Check className="w-3 h-3 text-primary shrink-0" />{f}
            </li>
          ))}
        </ul>
      )
    }
    default: {
      const value = pkg[key as keyof Package]
      return hlWrap(<span>{String(value ?? "-")}</span>)
    }
  }
}

function compareRows(pkgs: Package[], key: string, _scores: ReturnType<typeof calcScore>[]): ("best" | "worst" | undefined)[][] {
  if (pkgs.length < 2) return pkgs.map(() => [])
  return pkgs.map((pkg, i) => {
    const others = pkgs.filter((_, j) => j !== i)
    return others.map((other) => {
      if (key === "price") {
        const a = Number(pkg.price) || 0
        const b = Number(other.price) || 0
        if (a < b) return "best"
        if (a > b) return "worst"
      }
      if (key === "duration") {
        const a = Number(pkg.duration_nights) || 0
        const b = Number(other.duration_nights) || 0
        if (a > b) return "best"
        if (a < b) return "worst"
      }
      if (key === "hotel_makkah_stars" || key === "hotel_madinah_stars") {
        const field = key === "hotel_makkah_stars" ? "hotel_makkah_stars" : "hotel_madinah_stars"
        const a = Number(pkg[field]) || 0
        const b = Number(other[field]) || 0
        if (a > b) return "best"
        if (a < b) return "worst"
      }
      if (key === "facilities") {
        const a = getFacilitiesList(pkg.facilities).length
        const b = getFacilitiesList(other.facilities).length
        if (a > b) return "best"
        if (a < b) return "worst"
      }
      return undefined
    })
  })
}

function PackagePickerModal({ onClose }: {
  onClose: () => void
}) {
  const { comparePackages, addToCompare, compareCount } = useCompare()
  const [query, setQuery] = useState("")
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (compareCount >= MAX_COMPARE) onClose()
  }, [compareCount, onClose])

  useEffect(() => {
    const supabase = createClient()
    let active = true
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .in("status", ["active", "ongoing"])
        .neq("type", "haji")
        .is("deleted_at", null)
        .limit(60)
      if (active && !error && data) {
        const enriched = await enrichPackagesWithDetail(supabase, data as Package[])
        if (active) setPackages(enriched || [])
      }
      if (active) setLoading(false)
    }
    fetchPackages()
    return () => { active = false }
  }, [])

  const selectedIds = new Set(comparePackages.map((p) => p.id))
  const q = query.toLowerCase().trim()
  const filtered = packages.filter((pkg) => {
    if (q === "") return true
    const haystack = [pkg.name, pkg.description, pkg.departure_city, pkg.airline]
      .filter(Boolean).join(" ").toLowerCase()
    return haystack.includes(q)
  })

  const slotsLeft = MAX_COMPARE - compareCount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold">Pilih Paket</h3>
            <p className="text-xs text-muted-foreground">Pilih paket untuk dibandingkan ({slotsLeft} slot tersisa)</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama paket, kota, atau maskapai..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Tidak ada paket ditemukan</p>
          ) : (
            filtered.map((pkg) => {
              const isSelected = selectedIds.has(pkg.id)
              const noSlot = slotsLeft <= 0
              return (
                <button
                  key={pkg.id}
                  disabled={isSelected || noSlot}
                  onClick={() => {
                    addToCompare(pkg)
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-colors text-left ${
                    isSelected
                      ? "border-emerald-200 bg-emerald-50/50 cursor-default"
                      : noSlot
                        ? "border-border opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <Image
                      src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"}
                      alt={pkg.name || "Paket"} fill className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug line-clamp-1">{pkg.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {pkg.departure_city || "-"} · {pkg.airline || "-"} · {pkg.duration_nights || "-"} Hari
                    </p>
                    <p className="text-xs font-bold text-primary mt-0.5">{formatRupiah(Number(pkg.price) || 0)}</p>
                  </div>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0">
                      <Check className="w-3.5 h-3.5" /> Terpilih
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="p-3 border-t border-border text-center text-xs text-muted-foreground">
          {compareCount}/{MAX_COMPARE} paket dibandingkan
        </div>
      </div>
    </div>
  )
}

function CompareView({ onOpenPicker }: { onOpenPicker: () => void }) {
  const { comparePackages, removeFromCompare } = useCompare()

  const scores = useMemo(() => comparePackages.map(calcScore), [comparePackages])

  const rowHighlights = useMemo(() => {
    if (comparePackages.length < 2) return {}
    const highlights: Record<string, ("best" | "worst" | undefined)[][]> = {}
    ROW_LABELS.forEach((row) => {
      const arr = compareRows(comparePackages, row.key, scores)
      if (arr.length === comparePackages.length && arr.every((r) => r.length === comparePackages.length - 1)) {
        const result: ("best" | "worst" | undefined)[] = []
        for (let i = 0; i < comparePackages.length; i++) {
          const allBest = arr[i].length > 0 && arr[i].every((h) => h === "best")
          const allWorst = arr[i].length > 0 && arr[i].every((h) => h === "worst")
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
      lines.push(`${cheapestName} lebih hemat ${formatRupiah(Math.round(diff))} per hari dibanding ${expensiveName}.`)
    }

    const maxVal = Math.max(...scores.map((s) => s.valueScore))
    const minVal = Math.min(...scores.map((s) => s.valueScore))
    const bestValue = scores.findIndex((s) => s.valueScore === maxVal)
    const worstValue = scores.findIndex((s) => s.valueScore === minVal)

    if (bestValue !== worstValue && bestValue >= 0 && worstValue >= 0) {
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>(undefined)

  if (comparePackages.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/30">
          <Scale className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-semibold text-lg mb-2 text-zinc-800">Belum ada paket dibandingkan</h3>
        <p className="text-sm text-muted-foreground mb-8">Pilih hingga {MAX_COMPARE} paket umroh untuk menemukan yang terbaik versi Anda</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {Array.from({ length: MAX_COMPARE }).map((_, slotIdx) => (
            <button
              key={`empty-add-slot-${slotIdx}`}
              onClick={onOpenPicker}
              className="group rounded-2xl border-2 border-dashed border-emerald-300/70 bg-white flex flex-col items-center justify-center gap-2 text-emerald-700 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 min-h-[140px]"
            >
              <span className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Plus className="w-7 h-7" />
              </span>
              <span className="text-sm font-semibold">Tambah Paket</span>
              <span className="text-xs text-muted-foreground">pilih dari daftar paket</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const maxScore = Math.max(...scores.map((s) => s.valueScore))

  return (
    <div className="pb-4">
      {insightLines.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 mb-6 border border-white/60 bg-white/45 backdrop-blur-xl shadow-sm shadow-emerald-900/5"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(209,250,229,0.35), rgba(255,255,255,0.55))" }}>
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #059669 1px, transparent 0)", backgroundSize: "16px 16px" }}
            aria-hidden="true" />
          <div className="relative flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-sm font-bold text-zinc-800">Perbandingan Cerdas</span>
          </div>
          <ul className="relative space-y-1.5 mt-2">
            {insightLines.map((line, i) => (
              <li key={i} className="text-xs leading-relaxed text-zinc-600 flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />{line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MOBILE: Carousel view */}
      <div className="block sm:hidden">
        <Carousel opts={{ loop: false, align: "start" }} setApi={setCarouselApi}>
          <CarouselContent>
            {comparePackages.map((pkg, i) => (
              <CarouselItem key={pkg.id}>
                <MobileCompareSlide
                  pkg={pkg} index={i} scores={scores} maxScore={maxScore}
                  rowHighlights={rowHighlights} removeFromCompare={removeFromCompare}
                />
              </CarouselItem>
            ))}
            {emptySlots > 0 && (
              <CarouselItem>
                <button
                  onClick={onOpenPicker}
                  className="group w-full min-h-[320px] rounded-2xl border-2 border-dashed border-emerald-300/70 bg-white flex flex-col items-center justify-center gap-2 text-emerald-700 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300"
                >
                  <span className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Plus className="w-7 h-7" />
                  </span>
                  <span className="text-sm font-semibold">Tambah Paket</span>
                  <span className="text-xs text-muted-foreground">pilih dari daftar paket</span>
                </button>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>
        <MobileDotIndicator total={comparePackages.length + (emptySlots > 0 ? 1 : 0)} api={carouselApi} />
      </div>

      {/* DESKTOP: Grid table view */}
      <div className="hidden sm:block overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid gap-4 mb-6 grid-cols-[minmax(160px,20%)_repeat(3,minmax(0,1fr))]">
            <div />
            {Array.from({ length: MAX_COMPARE }).map((_, slotIdx) => {
              const pkg = comparePackages[slotIdx]
              if (pkg) {
                const i = slotIdx
                const isBest = comparePackages.length > 1 && scores[i].valueScore === maxScore && maxScore > 0
                return (
                  <div key={pkg.id} className={`bg-white border-2 rounded-2xl overflow-hidden transition-shadow ${isBest ? "border-emerald-500 shadow-lg shadow-emerald-200/60" : "border-primary/30 shadow-sm"}`}>
                    <div className={`relative h-28 ${isBest ? "" : ""}`}>
                      {isBest && (
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 z-10" />
                      )}
                      <Image src={pkg.image_url || "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80&fm=webp&auto=format"} alt={pkg.name || "Paket"} fill className="object-cover" />
                      <button onClick={() => removeFromCompare(pkg.id)} className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <PackageStatusBadge status={pkg.status} />
                        {isBest && (
                          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md shadow-amber-500/40 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Pilihan Terbaik
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold leading-snug line-clamp-2">{pkg.name}</p>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Rp {Math.round(scores[i].pricePerDay / 1000)}rb / hari
                      </div>
                      <SmartBadges scores={scores} index={i} />
                    </div>
                  </div>
                )
              }
              return (
                <button
                  key={`add-slot-${slotIdx}`}
                  onClick={onOpenPicker}
                  className="group rounded-2xl border-2 border-dashed border-emerald-300/70 bg-white flex flex-col items-center justify-center gap-2 text-emerald-700 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100 transition-all py-10"
                >
                  <span className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Plus className="w-6 h-6" />
                  </span>
                  <span className="text-xs font-semibold">Tambah Paket</span>
                  <span className="text-[10px] text-muted-foreground">pilih dari daftar paket</span>
                </button>
              )
            })}
          </div>

          {ROW_LABELS.map((row, idx) => (
            <div
              key={row.key}
              className={`grid grid-cols-[minmax(160px,20%)_repeat(3,minmax(0,1fr))] gap-4 py-3 ${idx % 2 === 0 ? "bg-muted/30" : ""} rounded-xl px-2`}
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
            </div>
          ))}

          <div className="grid grid-cols-[minmax(160px,20%)_repeat(3,minmax(0,1fr))] gap-4 mt-4 pt-4 border-t border-border">
            <div />
            {comparePackages.map((pkg) => (
              <Link key={pkg.id} href={`/package/${pkg.slug}`}>
                <Button className="w-full text-xs h-9 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-600/25">Pilih Paket Ini</Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CompareContent() {
  const searchParams = useSearchParams()
  const { compareCount, comparePackages, addToCompare, clearCompare } = useCompare()

  const packagesParam = useMemo(() => searchParams.getAll("packages"), [searchParams])

  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (packagesParam.length === 0) return
    const supabase = createClient()
    const fetchUrlPackages = async () => {
      const { data } = await supabase
        .from("packages")
        .select("*")
        .in("slug", packagesParam)
        .is("deleted_at", null)
      if (data && data.length > 0) {
        const enriched = await enrichPackagesWithDetail(supabase, data as Package[])
        ;(enriched || []).forEach((pkg) => {
          addToCompare(pkg)
        })
      }
    }
    fetchUrlPackages()
  }, [packagesParam, addToCompare])

  useEffect(() => {
    const supabase = createClient()
    const fetchTenants = async () => {
      await supabase.from("tenants").select("id").limit(0)
      setLoading(false)
    }
    fetchTenants()
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
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/60 to-emerald-100/40 border-b border-emerald-100/60 px-4 sm:px-6 py-6 sm:py-8">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-200/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-amber-100/30 blur-3xl" aria-hidden />
        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white border border-emerald-200/70 flex items-center justify-center shadow-sm">
              <Scale className="w-5 h-5 text-emerald-600" />
            </span>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">Bandingkan Paket</h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">Bandingkan hingga {MAX_COMPARE} paket sekaligus untuk menemukan pilihan terbaik</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {compareCount > 0 && (
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">{compareCount}/{MAX_COMPARE} paket dipilih</span>
            <div className="flex items-center gap-4">
              <button
                onClick={clearCompare}
                className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
              >
                Atur Ulang
              </button>
            </div>
          </div>
        )}
        <CompareView onOpenPicker={() => setPickerOpen(true)} />
      </div>

      {pickerOpen && (
        <PackagePickerModal onClose={() => setPickerOpen(false)} />
      )}

      <AiChatPanel packages={comparePackages} />
    </main>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </main>
    }>
      <CompareContent />
    </Suspense>
  )
}
