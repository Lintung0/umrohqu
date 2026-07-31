import PackageSection from "@/components/ui/home/package-section"
import SearchWidget from "@/components/ui/home/search-widget"
import { IslamicWidgets } from "@/components/ui/islamic-widgets"
import {
  StatsSection,
  WhyUsSection,
  TravelAgenciesSection,
  TestimonialSection,
  TrustSection,
} from "@/components/ui/home/extra-sections"

export default function Home() {
  return (
    <main className="flex-1">
      {/* Quick Search & Filter Bar right below Navbar */}
      <section className="bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary py-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
              Temukan Paket Umroh Impian Anda
            </h1>
            <p className="text-sm text-white/70 max-w-lg mx-auto">
              Bandingkan ratusan paket umroh resmi dari berbagai travel partner terpercaya
            </p>
          </div>
          <SearchWidget />
        </div>
      </section>

      {/* Grid Katalog Paket Umroh (Marketplace Core: First thing user sees) */}
      <PackageSection />

      {/* Islamic Utility Widget Bar */}
      <IslamicWidgets />

      {/* Why Us / Keunggulan Kami */}
      <WhyUsSection />

      {/* Travel Agencies & Testimonials */}
      <TravelAgenciesSection />
      <TrustSection />
      <TestimonialSection />
    </main>
  )
}

