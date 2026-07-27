"use client"

import { useEffect, useState } from "react"
import { BookOpen, RefreshCw } from "lucide-react"

interface DailyContent {
  arabic?: string
  latin?: string
  translation?: string
  source?: string
  type: "doa" | "hadits"
}

const DAILY_DOAS: DailyContent[] = [
  {
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
    latin: "Allahumma inni as'alukal 'afiyah fid-dunya wal-akhirah",
    translation: "Ya Allah, sesungguhnya aku memohon kepada-Mu kesejahteraan di dunia dan akhirat.",
    source: "HR. Ibnu Majah",
    type: "doa",
  },
  {
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    latin: "Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah wa qina 'adzaban-nar",
    translation: "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan peliharalah kami dari siksa neraka.",
    source: "QS. Al-Baqarah: 201",
    type: "doa",
  },
  {
    arabic: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا",
    latin: "Allahumma barik lana fima razaqtana",
    translation: "Ya Allah, berkahilah rezeki yang telah Engkau berikan kepada kami.",
    source: "HR. Muslim",
    type: "doa",
  },
  {
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ",
    latin: "Subhanallahi wa bihamdihi, subhanallahil 'adzim",
    translation: "Maha Suci Allah dan segala puji bagi-Nya, Maha Suci Allah yang Maha Agung.",
    source: "HR. Bukhari & Muslim",
    type: "doa",
  },
  {
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    latin: "La ilaha illallahu wahdahu la syarika lah, lahul mulku wa lahul hamdu wa huwa 'ala kulli syay'in qodir",
    translation: "Tidak ada Tuhan selain Allah, Yang Maha Esa, tidak ada sekutu bagi-Nya. Milik-Nyalah segala kerajaan dan segala puji. Dan Dia Maha Kuasa atas segala sesuatu.",
    source: "HR. Bukhari & Muslim",
    type: "doa",
  },
  {
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ",
    latin: "Allahumma inni a'udzu bika minal-hammi wal-hazan, wa a'udzu bika minal-'ajzi wal-kasal",
    translation: "Ya Allah, sesungguhnya aku berlindung kepada-Mu dari kegelisahan dan kesedihan, dan aku berlindung kepada-Mu dari kelemahan dan kemalasan.",
    source: "HR. Ibnu Abi Dunya",
    type: "doa",
  },
]

const DAILY_HADITS: DailyContent[] = [
  {
    arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا، سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ",
    latin: "Man salaka thariqan yaltamisu fihil 'ilman, sakhkhara Allahu lahu thariqan ilal jannah",
    translation: "Barangsiapa menempuh jalan untuk menuntut ilmu, maka Allah akan memudahkan baginya jalan menuju surga.",
    source: "HR. Muslim",
    type: "hadits",
  },
  {
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    latin: "Al-Muslimu man salimal muslimuna min lisanihi wa yadih",
    translation: "Seorang muslim adalah orang yang使使使 other Muslims aman dari lisan dan tangannya.",
    source: "HR. Bukhari & Muslim",
    type: "hadits",
  },
  {
    arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    latin: "La yu'minu ahadukum hatta yuhibba li-akhihi ma yuhibbu linafsih",
    translation: "Tidak sempurna iman seseorang di antara kamu sehingga dia mencintai untuk saudaranya apa yang dia cintai untuk dirinya sendiri.",
    source: "HR. Bukhari & Muslim",
    type: "hadits",
  },
]

export default function DailyDoa() {
  const [content, setContent] = useState<DailyContent | null>(null)

  useEffect(() => {
    const today = new Date()
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    )

    const allContent = [...DAILY_DOAS, ...DAILY_HADITS]
    const index = dayOfYear % allContent.length
    setContent(allContent[index])
  }, [])

  if (!content) return null

  return (
    <div className="glass-strong border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-gold-light">
          <BookOpen className="w-3.5 h-3.5 text-emerald-deep" />
        </div>
        <h3 className="text-xs font-semibold text-foreground/80">
          {content.type === "doa" ? "Doa Hari Ini" : "Hadits Hari Ini"}
        </h3>
      </div>

      <div className="space-y-3">
        {content.arabic && (
          <p className="text-right text-lg font-arabic leading-loose text-foreground/90" dir="rtl">
            {content.arabic}
          </p>
        )}

        {content.latin && (
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            {content.latin}
          </p>
        )}

        <p className="text-sm text-foreground/80 leading-relaxed">
          {content.translation}
        </p>

        {content.source && (
          <p className="text-[10px] text-primary/60 font-semibold">
            — {content.source}
          </p>
        )}
      </div>
    </div>
  )
}
