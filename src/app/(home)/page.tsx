import HeroSection from "@/components/ui/home/hero-section"
import PackageSection from "@/components/ui/home/package-section"
import { IslamicWidgets } from "@/components/ui/islamic-widgets"
import {
  StatsSection,
  WhyUsSection,
  TravelAgenciesSection,
  TestimonialSection,
  CTASection,
  TrustSection,
} from "@/components/ui/home/extra-sections"

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <IslamicWidgets />
      <TravelAgenciesSection />
      <PackageSection />
      <WhyUsSection />
      <TrustSection />
      <TestimonialSection />
      <CTASection />
    </main>
  )
}
