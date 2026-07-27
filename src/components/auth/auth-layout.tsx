"use client"

import { cn } from "@/lib/utils"

export function AuthLayout({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="flex min-h-dvh items-start justify-center bg-auth-bg px-4 pb-12 pt-6">
      <div
        className={cn(
          "mt-4 w-full max-w-[440px] rounded-[24px] bg-white px-8 pb-10 pt-9 shadow-[0_4px_32px_rgba(42,125,79,0.10),0_1px_4px_rgba(0,0,0,0.06)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
