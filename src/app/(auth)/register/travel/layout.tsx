export default function RegisterTravelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-950 text-white min-h-dvh py-10 px-4 sm:px-6 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {children}
      </div>
    </div>
  )
}
