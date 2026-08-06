"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface MarqueeProps {
  items: { name: string; logo?: string }[]
  speed?: "slow" | "normal" | "fast"
  className?: string
  pauseOnHover?: boolean
}

const DURATION_MAP = {
  slow: "40s",
  normal: "25s",
  fast: "15s",
}

export default function LogoMarquee({ items, speed = "normal", className, pauseOnHover = true }: MarqueeProps) {
  const duration = DURATION_MAP[speed]
  const duplicated = [...items, ...items, ...items]

  return (
    <div className={cn("relative overflow-hidden group", className)}>
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div
        className={cn(
          "flex items-center gap-8 w-max animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{ animationDuration: duration }}
      >
        {duplicated.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-colors shrink-0"
          >
            {item.logo ? (
              <Image
                src={item.logo}
                alt={item.name}
                width={28}
                height={28}
                className="rounded-full object-contain"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">{item.name.charAt(0)}</span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
