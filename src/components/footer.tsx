"use client"

import Logo from "./logo"
import Link from "next/link"
import Image from "next/image"
import { IslamicPattern } from "@/components/ui/islamic-pattern"
import { useTranslation } from "@/lib/i18n"
import dynamic from "next/dynamic"

const Kaaba3D = dynamic(() => import("@/components/ui/home/kaaba-3d"), { ssr: false })

interface FooterItem {
  href: string
  label: string
  icon?: string
}

interface FooterSection {
  title: string
  colSpan: string
  items: FooterItem[]
}

const Footer = () => {
  const { t } = useTranslation()

  const footerLinks: FooterSection[] = [
    {
      title: t.footer.about,
      colSpan: "md:col-span-3",
      items: [
        { href: "/about", label: t.footer.about },
        { href: "/faq", label: t.footer.faq },
        { href: "/articles", label: t.footer.blog },
        { href: "/terms", label: t.footer.terms },
        { href: "/privacy", label: t.footer.privacy },
      ],
    },
    {
      title: "Produk",
      colSpan: "md:col-span-2",
      items: [
        { href: "/search", label: t.footer.packages },
        { href: "/promotions", label: t.nav.promo },
        { href: "/travel", label: "Travel" },
        { href: "/compare", label: "Bandingkan" },
      ],
    },
    {
      title: t.footer.follow_us,
      colSpan: "md:col-span-3",
      items: [
        { href: "https://facebook.com", label: "Facebook", icon: "/icons/facebook.svg" },
        { href: "https://instagram.com", label: "Instagram", icon: "/icons/instagram.svg" },
        { href: "https://twitter.com", label: "Twitter", icon: "/icons/twitter.svg" },
      ],
    },
  ]
  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Smooth gradient transition from background to deep navy footer */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-deep to-emerald-deep -z-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary -z-30" />
      <div className="absolute inset-0 text-white -z-10">
        <IslamicPattern opacity={0.02} />
      </div>

      <div className="relative max-w-7xl mx-auto pt-16 pb-6 px-6 md:px-12">
        {/* 3D Kaaba Interactive Showcase combined inside Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-14 pb-14 border-b border-white/10">
          <div className="space-y-4 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold">
              Perjalanan Suci Berkualitas
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Wujudkan Niat Suci Bersama UmrohQu
            </h2>
            <p className="text-sm text-white/70 leading-relaxed max-w-lg">
              Platform marketplace umroh terpercaya yang menghubungkan Anda dengan travel agency resmi berizin Kemenag dari berbagai belahan dunia dengan transparansi harga dan pembayaran aman.
            </p>
          </div>
          <div className="w-full h-[300px]">
            <Kaaba3D />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-6">
          {/* Brand + Contact */}
          <div className="col-span-1 md:col-span-4 space-y-6">
            <div className="[&>a>img]:brightness-0 [&>a>img]:invert">
              <Logo />
            </div>
            <div className="space-y-3">
              <Link
                href={`https://wa.me/${process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "6281234567890"}?text=Assalamualaikum,%20saya%20mau%20tanya%20paket%20umroh%20terbaik%20untuk%20keluarga%20saya`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-white/60 hover:text-white transition-colors"
              >
                <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/15 transition-colors">
                  <Image src="/icons/whatsapp.svg" alt="Whatsapp" width={20} height={20} className="w-5 h-5 brightness-0 invert" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">WhatsApp</p>
                  <p className="text-sm font-medium">+62 82232169960</p>
                </div>
              </Link>
              <Link
                href="mailto:info@umrohq.com"
                className="group flex items-center gap-3 text-white/60 hover:text-white transition-colors"
              >
                <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/15 transition-colors">
                  <Image src="/icons/gmail.svg" alt="Email" width={20} height={20} className="w-5 h-5 brightness-0 invert" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Email</p>
                  <p className="text-sm font-medium">info@umrohq.com</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((section) => (
            <div
              key={section.title}
              className={`col-span-1 ${section.colSpan} space-y-4`}
            >
              <h3 className="font-semibold text-xs uppercase tracking-wider text-white/40">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={
                        item.href.startsWith("http") || item.href.includes(".com")
                          ? item.href.startsWith("http")
                            ? item.href
                            : `https://${item.href}`
                          : item.href
                      }
                      target={item.icon ? "_blank" : undefined}
                      rel={item.icon ? "noopener noreferrer" : undefined}
                      className="w-fit flex items-center gap-2.5 text-white/50 hover:text-white transition-colors text-sm"
                    >
                      {item.icon && (
                        <Image
                          src={item.icon}
                          alt={item.label}
                          width={16}
                          height={16}
                          className="w-4 h-4 brightness-0 invert opacity-50 group-hover:opacity-100"
                        />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              &copy; 2026 PT. Universal Big Data - UmrohQu. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-xs text-white/30">
              Made with
              <span className="text-gold/60">&hearts;</span>
              for Indonesian Umrah
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
