"use client"

import Logo from "./logo"
import Link from "next/link"
import Image from "next/image"
import { IslamicPattern } from "@/components/ui/islamic-pattern"
import { useTranslation } from "@/lib/i18n"
import dynamic from "next/dynamic"
import { useState } from "react"
import CountrySelect from "@/components/shared/country-select"
import { CompactLanguageSwitcher } from "@/components/shared/compact-language-switcher"

const Kaaba3D = dynamic(() => import("@/components/ui/home/kaaba-3d"), { ssr: false })

const columnHeadingClass = "font-bold text-xs uppercase tracking-wider text-white/50"

const Footer = () => {
  const { t } = useTranslation()
  const [country, setCountry] = useState("id")

  const handleCountryChange = async (code: string) => {
    setCountry(code)
    try {
      await fetch("/api/user/country", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: code }),
      })
    } catch {}
  }

  const footerLinks = [
    {
      title: t.footer.quick_links,
      items: [
        { href: "/about", label: t.footer.about },
        { href: "/faq", label: t.footer.faq },
        { href: "/articles", label: t.footer.blog },
        { href: "/terms", label: t.footer.terms },
        { href: "/privacy", label: t.footer.privacy },
      ],
    },
    {
      title: t.footer.products,
      items: [
        { href: "/search", label: t.footer.packages },
        { href: "/promotions", label: t.nav.promo },
        { href: "/travel", label: t.footer.travel_agencies },
        { href: "/compare", label: t.footer.compare },
      ],
    },
  ]

  const socialLinks = [
    { href: "https://www.facebook.com", label: "Facebook", icon: "/icons/facebook.svg" },
    { href: "https://www.instagram.com", label: "Instagram", icon: "/icons/instagram.svg" },
    { href: "https://x.com", label: "X / Twitter", icon: "/icons/twitter.svg" },
  ]

  return (
    <footer className="relative mt-auto overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 -z-10" />
      <div className="absolute inset-0 text-white -z-10">
        <IslamicPattern opacity={0.02} />
      </div>

      <div className="relative max-w-7xl mx-auto pt-16 pb-20 lg:pb-8 px-4 sm:px-6 lg:px-8">
        {/* Kaaba3D showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-14 pb-14 border-b border-white/10">
          <div className="space-y-4 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-semibold">
              {t.footer.tagline}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {t.footer.headline}
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-lg">
              {t.footer.hero_desc}
            </p>
          </div>
          <div className="w-full h-[300px]">
            <Kaaba3D />
          </div>
        </div>

        {/* Main columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10 py-6">
          {/* Brand + Contact */}
          <div className="col-span-1 md:col-span-4 space-y-5">
            <div className="[&>a>img]:brightness-0 [&>a>img]:invert">
              <Logo />
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-sm">
              {t.footer.description}
            </p>
            <div className="space-y-2.5 pt-2">
              <h3 className={columnHeadingClass}>{t.footer.contact_us}</h3>
              <Link
                href={`https://wa.me/${process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "6281234567890"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/50 hover:text-white transition-colors group"
              >
                <div className="p-2 rounded-lg bg-white/8 group-hover:bg-white/12 transition-colors">
                  <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={18} height={18} className="brightness-0 invert" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">WhatsApp</p>
                  <p className="text-sm font-medium">{process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "+62 812-3456-7890"}</p>
                </div>
              </Link>
              <Link
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@umrahqu.com"}`}
                className="flex items-center gap-3 text-white/50 hover:text-white transition-colors group"
              >
                <div className="p-2 rounded-lg bg-white/8 group-hover:bg-white/12 transition-colors">
                  <Image src="/icons/gmail.svg" alt="Email" width={18} height={18} className="brightness-0 invert" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">Email</p>
                  <p className="text-sm font-medium">{process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@umrahqu.com"}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((section) => (
            <div key={section.title} className="col-span-1 md:col-span-2 space-y-4">
              <h3 className={columnHeadingClass}>{section.title}</h3>
              <ul className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Follow Us */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className={columnHeadingClass}>{t.footer.follow_us}</h3>
            <ul className="flex flex-col gap-2">
              {socialLinks.map((s) => (
                <li key={s.label}>
                  <Link
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex items-center gap-2.5 text-white/50 hover:text-white transition-colors text-sm"
                  >
                    <Image src={s.icon} alt={s.label} width={16} height={16} className="brightness-0 invert opacity-50" />
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-6 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/25">
              &copy; 2026 UmrahQu — PT. Universal Big Data. {t.footer.rights}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              <CountrySelect value={country} onChange={handleCountryChange} variant="dark" />
              <CompactLanguageSwitcher />
              <span className="text-xs text-white/25">
                {t.footer.made_with} <span className="text-amber-400/50">&hearts;</span> {t.footer.for_umrah}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
