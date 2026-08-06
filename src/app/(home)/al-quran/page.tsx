"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Play, Pause, ChevronDown, BookOpen, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Surah {
  nomor: number
  nama: string
  namaLatin: string
  jumlahAyat: number
  tempatTurun: string
  arti: string
  deskripsi: string
}

interface Ayat {
  nomorAyat: number
  teksArab: string
  teksLatin: string
  teksIndonesia: string
  audio: Record<string, string>
}

interface SurahDetail {
  nomor: number
  nama: string
  namaLatin: string
  jumlahAyat: number
  tempatTurun: string
  arti: string
  deskripsi: string
  ayat: Ayat[]
  tafsir: Record<string, string>
}

const QORI_LIST = [
  { id: "abdulrahman-as-sudais", name: "Abdul Rahman As-Sudais" },
  { id: "mishary-rashid-alafasy", name: "Mishary Rashid Alafasy" },
  { id: "saad-al-ghamdi", name: "Saad Al-Ghamdi" },
  { id: "ahmed-ajamy", name: "Ahmed Ajamy" },
]

export default function AlQuranPage() {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [search, setSearch] = useState("")
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [playingAyat, setPlayingAyat] = useState<string | null>(null)
  const [selectedQori, setSelectedQori] = useState("abdulrahman-as-sudais")
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch("https://equran.id/api/v2/surat")
      .then((r) => r.json())
      .then((data) => {
        setSurahs(data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const fetchSurahDetail = async (nomor: number) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`https://equran.id/api/v2/surat/${nomor}`)
      const data = await res.json()
      setSelectedSurah(data.data)
    } catch {}
    setLoadingDetail(false)
  }

  const playAudio = (audioUrl: string, key: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      if (playingAyat === key) {
        setPlayingAyat(null)
        return
      }
    }
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    setPlayingAyat(key)
    audio.play()
    audio.onended = () => setPlayingAyat(null)
  }

  const filteredSurahs = surahs.filter(
    (s) =>
      s.namaLatin.toLowerCase().includes(search.toLowerCase()) ||
      s.nama.includes(search) ||
      s.nomor.toString().includes(search)
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Al-Qur'an Digital
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-2">Al-Qur'an</h1>
          <p className="text-muted-foreground text-sm">Baca 114 surah lengkap dengan terjemahan & audio</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari surah (nama / nomor)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20"
          />
        </div>

        {selectedSurah ? (
          <div>
            <button
              onClick={() => setSelectedSurah(null)}
              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium mb-4"
            >
              ← Kembali ke Daftar Surah
            </button>

            <Card className="p-6 mb-6 bg-emerald-900 text-white border-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-3xl font-arabic">{selectedSurah.nama}</span>
                    <span className="text-lg font-bold">{selectedSurah.namaLatin}</span>
                  </div>
                  <p className="text-emerald-200 text-sm">
                    {selectedSurah.arti} • {selectedSurah.jumlahAyat} Ayat • {selectedSurah.tempatTurun}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold">
                  {selectedSurah.nomor}
                </div>
              </div>
            </Card>

            <Tabs defaultValue="ayat">
              <TabsList className="mb-4">
                <TabsTrigger value="ayat">Ayat</TabsTrigger>
                <TabsTrigger value="tafsir">Tafsir</TabsTrigger>
              </TabsList>

              <TabsContent value="ayat" className="space-y-4">
                {loadingDetail ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                  </div>
                ) : (
                  selectedSurah.ayat?.map((ayat) => {
                    const audioKey = `${selectedSurah.nomor}-${ayat.nomorAyat}`
                    const audioUrl = ayat.audio?.[selectedQori] || ayat.audio?.["abdulrahman-as-sudais"]
                    return (
                      <div key={ayat.nomorAyat} className="bg-white border border-emerald-100 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                            {ayat.nomorAyat}
                          </span>
                          {audioUrl && (
                            <button
                              onClick={() => playAudio(audioUrl, audioKey)}
                              className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                            >
                              {playingAyat === audioKey ? (
                                <Pause className="w-3.5 h-3.5 text-emerald-700" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-emerald-700 ml-0.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-right text-2xl leading-loose text-emerald-900 font-arabic mb-3" dir="rtl">
                          {ayat.teksArab}
                        </p>
                        <p className="text-sm text-emerald-700 italic mb-2">{ayat.teksLatin}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{ayat.teksIndonesia}</p>
                      </div>
                    )
                  })
                )}
              </TabsContent>

              <TabsContent value="tafsir">
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Tafsir Per Ayat</h3>
                  <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                    {selectedSurah.tafsir?.id || "Tafsir tidak tersedia"}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div>
            {/* Qori selector */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Qori:</span>
              <select
                value={selectedQori}
                onChange={(e) => setSelectedQori(e.target.value)}
                className="text-xs border border-emerald-200 rounded-lg px-2 py-1.5 bg-white"
              >
                {QORI_LIST.map((q) => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-emerald-100" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSurahs.map((surah) => (
                  <button
                    key={surah.nomor}
                    onClick={() => fetchSurahDetail(surah.nomor)}
                    className="flex items-center gap-3 p-3 bg-white border border-emerald-100 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all text-left group"
                  >
                    <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-bold group-hover:bg-emerald-100 transition-colors shrink-0">
                      {surah.nomor}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{surah.namaLatin}</p>
                      <p className="text-xs text-muted-foreground">{surah.arti} • {surah.jumlahAyat} ayat</p>
                    </div>
                    <span className="text-lg font-arabic text-emerald-600 shrink-0">{surah.nama}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
