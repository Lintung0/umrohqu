"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhoneInputProps {
  value: string
  onChange: (v: string) => void
  error?: string
  hideLabel?: boolean
}

export function PhoneInput({ value, onChange, error, hideLabel }: PhoneInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && (
        <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
          Nomor Telepon
        </label>
      )}
      <div
        className={cn(
          "flex min-h-[52px] items-stretch overflow-hidden rounded-[14px] border-[1.5px] transition-[border-color,box-shadow] duration-150",
          error
            ? "border-auth-error"
            : focused
              ? "border-auth-primary shadow-[0_0_0_3px_rgba(42,125,79,0.13)]"
              : "border-auth-border",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 border-r-[1.5px] px-3 pl-3.5",
            focused ? "border-auth-primary/30 bg-auth-primary-light" : "border-auth-border bg-auth-bg",
          )}
        >
          <span className="text-lg">🇮🇩</span>
          <span className="text-[15px] font-semibold text-auth-secondary-foreground">+62</span>
        </div>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="812-3456-7890"
          autoComplete="tel"
          inputMode="tel"
          className="flex-1 border-none bg-transparent px-4 py-3.5 text-[16px] text-auth-foreground outline-none placeholder:text-auth-muted-foreground/60"
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-auth-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  )
}
