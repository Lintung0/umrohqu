import { IslamicPattern } from "@/components/ui/islamic-pattern"
import Logo from "@/components/logo"

export default function RegisterTravelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh">
      {/* Left panel — brand (hidden, kept for spacing consistency) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-emerald-deep via-emerald-dark to-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 text-white">
          <IslamicPattern opacity={0.04} />
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-glow/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-gold/8 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="[&>a>img]:brightness-0 [&>a>img]:invert [&>a>img]:h-10">
            <Logo />
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-3xl font-bold text-white leading-tight">
            Daftarkan Travel Anda
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Bergabung dengan ribuan travel umroh yang telah mempercayakan bisnis mereka bersama UmrahQu.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/30">
          &copy; 2026 UmrahQu. All rights reserved.
        </div>
      </div>

      {/* Right panel — form (full width on mobile, half on desktop) */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[520px]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
