"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PrimaryButtonProps {
  children: React.ReactNode
  onClick?: () => void
  loading?: boolean
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}

export function PrimaryButton({
  children,
  onClick,
  loading,
  type = "button",
  disabled,
  className,
}: PrimaryButtonProps) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={cn(
        "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border-none text-[16px] font-bold transition-[background,transform] duration-150",
        loading || disabled ? "cursor-not-allowed bg-auth-primary-muted text-ivory-ink/60" : "cursor-pointer text-ivory",
        className,
      )}
      style={{
        background: loading || disabled ? undefined : pressed ? "#0A1F16" : "#0D3D2B",
        boxShadow: pressed || loading || disabled ? "none" : "0 1px 3px rgba(10,31,22,0.2)",
        transform: pressed ? "scale(0.99)" : "scale(1)",
      }}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}
