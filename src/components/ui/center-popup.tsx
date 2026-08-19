"use client"

import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CenterPopupProps {
  show: boolean
  message: string
  onClose?: () => void
  duration?: number
}

export function CenterPopup({ show, message, onClose, duration = 1500 }: CenterPopupProps) {
  const [visible, setVisible] = useState(false)
  const [animatingOut, setAnimatingOut] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      setAnimatingOut(false)
      const timer = setTimeout(() => {
        setAnimatingOut(true)
        setTimeout(() => {
          setVisible(false)
          onClose?.()
        }, 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div
        className={cn(
          "flex flex-col items-center gap-3 bg-white rounded-2xl px-8 py-6 shadow-2xl border border-gray-100 transition-all duration-300",
          animatingOut
            ? "opacity-0 scale-90"
            : "opacity-100 scale-100 animate-in zoom-in-95 duration-200"
        )}
      >
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-gray-800 text-center max-w-[200px]">{message}</p>
      </div>
    </div>
  )
}
