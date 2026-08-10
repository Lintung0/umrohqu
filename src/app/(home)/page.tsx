import PackageSection from "@/components/ui/home/package-section"
import SearchWidget from "@/components/ui/home/search-widget"
import { IslamicWidgets } from "@/components/ui/islamic-widgets"
import {
  WhyUsSection,
  TravelAgenciesSection,
  TestimonialSection,
  TrustSection,
} from "@/components/ui/home/extra-sections"

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[380px] md:min-h-[520px] flex items-end overflow-visible">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/e/e7/Kaaba_Masjid_haraam.jpg')",
          }}
        />
        {/* Dark Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-emerald-950/75 to-slate-900/70" />

        <div className="relative z-10 w-full pb-16 pt-10 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 space-y-2">
              <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg">
                Temukan Paket Umroh Impian Anda
              </h1>
              <p className="text-emerald-100 font-medium text-base drop-shadow-sm max-w-lg mx-auto">
                Bandingkan ratusan paket umroh resmi dari berbagai travel partner terpercaya
              </p>
            </div>
            <div className="relative z-20 -mb-10">
              <SearchWidget />
            </div>
          </div>
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

