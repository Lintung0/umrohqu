"use client"

import Logo from "./logo"
import Link from "next/link"
import Image from "next/image"
import { IslamicPattern } from "@/components/ui/islamic-pattern"
import { useTranslation } from "@/lib/i18n"

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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary" />
      <div className="absolute inset-0 text-white">
        <IslamicPattern opacity={0.02} />
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-14 px-6 md:px-12 max-w-7xl mx-auto">
          {/* Brand + Contact */}
          <div className="col-span-1 md:col-span-4 space-y-6">
            <div className="[&>a>img]:brightness-0 [&>a>img]:invert">
              <Logo />
            </div>
            <div className="space-y-3">
              <Link
                href="https://wa.me/6282232169960?text=Assalamualaikum,%20saya%20mau%20tanya%20paket%20umroh%20terbaik%20untuk%20keluarga%20saya"
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
                href="mailto:ul01092022@gmail.com"
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
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
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
