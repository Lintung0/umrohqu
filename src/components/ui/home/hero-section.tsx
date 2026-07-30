"use client"

import { useTranslation } from "@/lib/i18n"
import SearchWidget from "./search-widget"
import { IslamicCorner } from "@/components/ui/islamic-pattern"
import dynamic from "next/dynamic"

const Kaaba3D = dynamic(() => import("./kaaba-3d"), { ssr: false })

export default function HeroSection() {
  const { t } = useTranslation()
  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary -z-30" />
      <div className="absolute inset-0 bg-[url('/images/hero.webp')] bg-cover bg-bottom opacity-15 -z-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep via-transparent to-emerald-deep/60 -z-10" />

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 text-white/15">
        <IslamicCorner position="top-left" />
      </div>
      <div className="absolute top-0 right-0 text-white/15">
        <IslamicCorner position="top-right" />
      </div>

      {/* Animated glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-glow/10 rounded-full blur-3xl animate-glow-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gold/8 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "1.5s" }} />

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left — Text */}
          <div className="space-y-6">
            {/* Badge */}
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/80 text-xs font-medium tracking-wide backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow animate-pulse" />
                Layanan Umroh & Haji Terpercaya
              </span>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in-up-delay-1 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              {t.hero.title}
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up-delay-2 text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* Trust badges */}
            <div className="animate-fade-in-up-delay-3 flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>4.9/5 Rating</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="text-white/50 text-sm">{t.hero.customers}</div>
              <div className="w-px h-4 bg-white/20" />
              <div className="text-white/50 text-sm">{t.hero.travel_partners}</div>
            </div>
          </div>

          {/* Right — 3D Kaaba */}
          <div className="hidden lg:block animate-fade-in-up-delay-2">
            <div className="w-full h-[420px]">
              <Kaaba3D />
            </div>
          </div>
        </div>

        {/* Search Widget */}
        <div className="mt-14 animate-fade-in-up-delay-4">
          <SearchWidget />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
