import HeroSection from "@/components/ui/home/hero-section"
import PackageSection from "@/components/ui/home/package-section"
import {
  StatsSection,
  WhyUsSection,
  TravelAgenciesSection,
  TestimonialSection,
  CTASection,
} from "@/components/ui/home/extra-sections"

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <StatsSection />
      <PackageSection />
      <WhyUsSection />
      <TravelAgenciesSection />
      <TestimonialSection />
      <CTASection />
    </main>
  )
}
